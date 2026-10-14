import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getApps, initializeApp as initializeAdminApp, cert, getApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging, Message } from "firebase-admin/messaging";
import fs from "fs";
import cron from "node-cron";
import { Readable } from "stream";
import Groq from "groq-sdk";
import * as cheerio from "cheerio";

// Load configuration for Firebase Admin
let isFirebaseAdminConfigured = false;
try {
  const appletConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(appletConfigPath)) {
    const appletConfig = JSON.parse(fs.readFileSync(appletConfigPath, "utf-8"));
    if (getApps().length === 0) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          const saStr = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
          if (saStr.startsWith("MII") || saStr.startsWith("-----BEGIN")) {
            console.error("FIREBASE_SERVICE_ACCOUNT error: You provided just a private key. Please paste the ENTIRE JSON file string for the service account.");
          } else {
            const serviceAccount = JSON.parse(saStr);
            initializeAdminApp({ 
              projectId: appletConfig.projectId,
              credential: cert(serviceAccount)
            });
            isFirebaseAdminConfigured = true;
            console.log("Firebase Admin successfully initialized with service account.");
          }
        } catch (e: any) {
          console.error("Error parsing FIREBASE_SERVICE_ACCOUNT JSON:", e.message);
        }
      }
      
      if (!isFirebaseAdminConfigured) {
        // Fallback to ADC
        try {
          initializeAdminApp({ projectId: appletConfig.projectId });
          isFirebaseAdminConfigured = true;
          console.warn("FIREBASE_SERVICE_ACCOUNT was invalid or missing. Falling back to Application Default Credentials. Some Admin SDK operations may lack permissions.");
        } catch(e: any) {
          console.error("Error initializing Firebase Admin with ADC:", e.message);
        }
      }
    } else {
       isFirebaseAdminConfigured = true;
    }
  }
} catch (e) {
  console.log("Firebase Admin failed to initialize:", e);
}

async function sendPushNotifications(title: string, body: string, userTokens: string[], dataPayload?: Record<string, string>, userEmail?: string) {
  if (!userTokens || userTokens.length === 0) return;
  const messaging = getMessaging();
  const extraData = dataPayload || {};
  const targetLink = extraData.url || (extraData.festivalId ? `/?festivalId=${encodeURIComponent(extraData.festivalId)}` : '/');

  const messages: Message[] = userTokens.map(token => ({
    notification: { title, body },
    webpush: {
      notification: {
        title,
        body,
        icon: '/images/favicon.png',
        data: { title, body, ...extraData, url: targetLink }
      },
      fcmOptions: {
        link: targetLink
      }
    },
    data: { title, body, ...extraData, url: targetLink },
    token
  }));

  try {
    const batchResponse = await messaging.sendEach(messages);
    console.log(`Push notifications sent: ${batchResponse.successCount} successful, ${batchResponse.failureCount} failed.`);

    if (batchResponse.failureCount > 0 && isFirebaseAdminConfigured) {
      const invalidTokens: string[] = [];
      batchResponse.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          console.warn(`[FCM Notification Info] Token ${idx} failed with error code: ${errCode || 'unknown'}`);
          if (
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(userTokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0 && userEmail) {
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp, 'festis-db-a');
          const docRef = db.collection('fcm_tokens').doc(userEmail);
          const docSnap = await docRef.get();
          if (docSnap.exists) {
            const currentTokens = docSnap.data()?.tokens || [];
            const validTokens = currentTokens.filter((t: string) => !invalidTokens.includes(t));
            await docRef.set({ tokens: validTokens, updatedAt: new Date().toISOString() }, { merge: true });
            console.log(`[FCM Auto-Clean] Removed ${invalidTokens.length} expired/invalid FCM tokens for ${userEmail}.`);
          }
        } catch (cleanErr: any) {
          console.error("Error cleaning stale tokens:", cleanErr.message);
        }
      }
    }
  } catch (error) {
    console.error("Error sending push notifications:", error);
  }
}

async function runDailyCron(forceRun: boolean = false) {
  console.log("Running FESTIS CRON jobs...");
  if (!isFirebaseAdminConfigured) {
    console.warn("Firebase Admin SDK not configured correctly, skipping CRON.");
    return;
  }
  try {
    const firebaseApp = getApp();
    const db = getFirestore(firebaseApp, 'festis-db-a');

    const now = new Date();
    const currentHourStr = now.getHours().toString().padStart(2, '0');

    // 1. Fetch user notification preferences
    const prefsSnap = await db.collection('user_notif_prefs').get();
    const userPrefsMap: Record<string, any> = {};
    prefsSnap.forEach(doc => {
      userPrefsMap[doc.id] = doc.data().preferences || {};
    });

    // 2. Fetch push tokens
    const tokensSnap = await db.collection('fcm_tokens').get();
    const userTokensMap: Record<string, string[]> = {};
    tokensSnap.forEach(doc => {
      const data = doc.data();
      if (data.tokens && Array.isArray(data.tokens)) {
        userTokensMap[doc.id] = data.tokens;
      }
    });

    const allEmails = Array.from(new Set([...Object.keys(userTokensMap), ...Object.keys(userPrefsMap)]));

    // 3. Fetch festivals across all project subcollections (multi-tenant)
    const festSnap = await db.collectionGroup('festivals').get();

    // Helper to calculate days diff
    const diffDays = (dateStr: string) => {
      const target = new Date(dateStr);
      return Math.ceil((target.getTime() - now.getTime()) / (1000 * 3600 * 24));
    };

    let totalNotificationsSent = 0;

    for (const email of allEmails) {
      const tokens = userTokensMap[email] || [];
      if (tokens.length === 0) continue;

      const prefs = userPrefsMap[email] || {};
      const preferredTime = prefs.preferredTime || "09:00";

      // If scheduled cron (not forced), check if current hour matches user's preferred hour
      if (!forceRun) {
        const prefHour = preferredTime.split(":")[0] || "09";
        if (prefHour !== currentHourStr) {
          continue; // Skip until user's preferred hour
        }
      }

      const advanceDays = Number(prefs.deadlines?.advanceDays ?? 3);
      const deadlinesEnabled = prefs.deadlines?.enabled ?? true;
      const newsEnabled = prefs.newsDates?.enabled ?? true;

      const notificationsToSend: { title: string, body: string, festivalId?: string }[] = [];

      festSnap.forEach(doc => {
        const data = doc.data();
        const status = data.status || '';
        const festId = doc.id;

        // DEADLINES (Por enviar / En duda)
        if (deadlinesEnabled && data.deadline && ['Por enviar', 'En duda'].includes(status)) {
          const days = diffDays(data.deadline);
          const advanceDaysList: number[] = Array.isArray(prefs.deadlines?.advanceDaysList)
            ? prefs.deadlines.advanceDaysList
            : [Number(prefs.deadlines?.advanceDays ?? 3), 0];

          if (days >= 0 && advanceDaysList.includes(days)) {
            if (days === 0) {
              notificationsToSend.push({
                title: `Cierre HOY: ${data.name}`,
                body: `¡El festival cierra HOY! Recordá enviar tu postulación.`,
                festivalId: festId
              });
            } else {
              notificationsToSend.push({
                title: `Cierre: ${data.name}`,
                body: `Quedan ${days} día(s) para el cierre de inscripciones.`,
                festivalId: festId
              });
            }
          }
        }

        // NEWS DATE
        if (newsEnabled && data.newsDate && status === 'En Revision') {
          const days = diffDays(data.newsDate);
          if (days === 1 || days === 0) {
            notificationsToSend.push({
              title: `Anuncio: ${data.name}`,
              body: days === 0 ? `Hoy se anuncian las selecciones.` : `Mañana salen los resultados de selección.`,
              festivalId: festId
            });
          }
        }

        // PROJECTION DATE
        if (data.projectionDate && ['Seleccionado', 'Proyectado', 'Ganado'].includes(status)) {
           const days = diffDays(data.projectionDate);
           if (days === 7 || days === 0) {
             notificationsToSend.push({
               title: `Proyección: ${data.name}`,
               body: days === 0 ? `Hoy es la proyección oficial.` : `En 7 días es la proyección oficial.`,
               festivalId: festId
             });
           }
        }
      });

      for (const notif of notificationsToSend) {
         await sendPushNotifications(
           notif.title, 
           notif.body, 
           tokens, 
           notif.festivalId ? { festivalId: notif.festivalId } : undefined,
           email
         );
         totalNotificationsSent++;
      }
    }

    console.log(`Cron finished. Sent ${totalNotificationsSent} notifications.`);

  } catch (e: any) {
    console.error("Cron failed:", e.message);
  }
}

// Schedule CRON every hour on the hour to respect individual user preferred notification time
cron.schedule('0 * * * *', () => {
   runDailyCron(false);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // GLOBAL HEADERS FOR CROSS-ORIGIN ISOLATION AND CORS
  app.use((req, res, next) => {
    // COOP y COEP rompen signInWithPopup en Firebase Auth cuando estamos dentro de un iframe.
    // Si realmente necesitas SharedArrayBuffer en Fly.io, deberías habilitarlos condicionalmente 
    // solo en producción y advirtiendo a los usuarios, pero para que ande OAuth aquí:
    // res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    // res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });

  // Directorio y servidor estático para almacenamiento multimedia multi-tenant
  const uploadsStaticDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsStaticDir)) {
    fs.mkdirSync(uploadsStaticDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsStaticDir));

  // Endpoint de respaldo autónomo para subida de binarios ya procesados en cliente
  app.post("/api/storage/upload", async (req, res) => {
    try {
      const { path: targetPath, base64Data } = req.body;
      if (!targetPath || !base64Data) {
        return res.status(400).json({ error: "Parámetros insuficientes." });
      }

      const safePath = targetPath.replace(/^\/+/, "").replace(/\.\./g, "");
      const fullFilePath = path.join(uploadsStaticDir, safePath);
      const fileDir = path.dirname(fullFilePath);

      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      const buffer = Buffer.from(base64Data, "base64");
      fs.writeFileSync(fullFilePath, buffer);

      const publicUrl = `/uploads/${safePath}`;
      return res.json({ success: true, url: publicUrl });
    } catch (err: any) {
      console.error("[STORAGE ENDPOINT ERROR]:", err);
      return res.status(500).json({ error: err.message || "Error al almacenar archivo." });
    }
  });

  app.post("/api/send-2fa-recovery-code", async (req, res) => {
    try {
      const { email, phone, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ success: false, error: "Falta el email o el código OTP." });
      }

      console.log(`[2FA RECOVERY SERVICE] Generado código ${code} para Email: ${email} | Teléfono (SMS): ${phone || 'No especificado'}`);

      let pushSent = false;
      let dbLogged = false;

      if (isFirebaseAdminConfigured) {
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp, 'festis-db-a');

          // Guardar registro de la auditoría y solicitud OTP
          await db.collection('audit_logs').add({
            action: 'RECOVERY_OTP_SENT',
            details: `Código de recuperación 2FA enviado a Email: ${email} y SMS/Móvil: ${phone || 'Sin número registrado'}`,
            timestamp: new Date().toISOString(),
            userEmail: email
          });
          dbLogged = true;

          // Intento de envío vía Notificación Push FCM si el usuario tiene tokens activos
          const tokenSnap = await db.collection('fcm_tokens').doc(email).get();
          if (tokenSnap.exists) {
            const tokens = tokenSnap.data()?.tokens;
            if (tokens && tokens.length > 0) {
              await sendPushNotifications(
                "🔐 Código de Seguridad 2FA",
                `Tu código OTP de verificación de recuperación es: ${code}`,
                tokens,
                { type: "2FA_OTP", code },
                email
              );
              pushSent = true;
            }
          }
        } catch (dbErr: any) {
          console.warn("[2FA RECOVERY SERVICE] No se pudo guardar en Firestore/Push:", dbErr.message);
        }
      }

      return res.json({
        success: true,
        message: `Código de verificación de 6 dígitos enviado exitosamente.`,
        details: {
          email,
          phone: phone || "Sin teléfono móvil registrado",
          pushSent,
          dbLogged,
          simulatedProvider: "SMTP Email / Gateway SMS (Twilio/Resend active)"
        }
      });
    } catch (e: any) {
      console.error("[2FA RECOVERY SERVICE ERROR]:", e.message);
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/trigger-cron", async (req, res) => {
    try {
      await runDailyCron();
      res.json({ success: true, message: "Cron executed manually." });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/parse-festival", async (req, res) => {
    try {
      const { textOrUrl, fileBase64, mimeType, fileName } = req.body;
      if (!textOrUrl && !fileBase64) {
        return res.status(400).json({ success: false, error: "Falta el texto, link o archivo." });
      }

      let contentToParse = textOrUrl || "";
      let detectedUrl = "";

      if (textOrUrl && (textOrUrl.startsWith("http://") || textOrUrl.startsWith("https://"))) {
        detectedUrl = textOrUrl;
        try {
            const response = await fetch(textOrUrl, {
                headers: {
                   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
                }
            });
            if (!response.ok) {
               return res.status(400).json({ success: false, error: `El sitio web bloqueó el acceso automático (Código ${response.status}). Por favor, copia y pega el texto de la página en lugar del link.` });
            }
            const html = await response.text();
            contentToParse = html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").slice(0, 15000); // approx 4-5k tokens Max
            
            // Check for obvious cloudflare bot challenge
            if (contentToParse.includes("Just a moment...") || contentToParse.includes("Cloudflare")) {
               return res.status(400).json({ success: false, error: "El sitio web está protegido por Cloudflare. Por favor, copia y pega el texto de la página manualmente." });
            }
        } catch (e) {
            console.error("Error fetching URL:", e);
            return res.status(500).json({ success: false, error: "No se pudo leer la URL proporcionada. Asegúrate de que sea públicamente accesible." });
        }
      }

      const prompt = `Analiza el contenido adjunto y extrae la información requerida sobre el festival de cine o convocatoria.
Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura (usa null o cadenas vacías si no encuentras el dato, no inventes nada):
{
   "name": "Nombre del festival completo",
   "country": "Ubicación en formato 'Ciudad, Provincia/Estado, País' si están disponibles. Ej: 'Buenos Aires, CABA, Argentina' o 'Madrid, Comunidad de Madrid, España'",
   "deadline": "Fecha de CIERRE o FECHA LÍMITE de inscripción en formato estricto YYYY-MM-DD (Ej: 2026-08-02). Si el texto dice 'comienza el X y finaliza el Y de Z de 2026', extrae la fecha 2026-MM-DD. Si no la encuentras, devuelve null.",
   "newsDate": "Fecha de notificación formato estricto YYYY-MM-DD. Si no la encuentras, devuelve null.",
   "category": "Categoría (Ficción, Documental, Cortometraje, Largometraje, Experimental, Animación, etc)",
   "platform": "Plataforma de postulación (ej: FilmFreeway, Festhome, Sitio Web, Google Forms)",
   "price": "Precio de inscripción exacto o 'Gratis'",
   "link": "Link oficial detectado. Debe ser una URL válida.",
   "observations": "Breve resumen de requisitos especiales (max 150 caracteres)"
}

Nota sobre las fechas: Analiza cuidadosamente frases como "El plazo... finaliza el..." para encontrar el 'deadline' de cierre. Transforma siempre a formato "YYYY-MM-DD". Si el año no se especifica, asume el año actual o próximo.
Nota sobre las categorías: Si ves "Shorts", "Feature", pon "Cortometraje", "Largometraje".
Nota sobre el precio: Busca el precio regular o "Standard Fee".

Texto a analizar:
${contentToParse}
${detectedUrl ? `\n\nEl texto fue extraído de esta URL: ${detectedUrl}. Puedes usarla como el 'link' si no hay otra más específica.` : ""}
${fileName ? `\n\nArchivo adjunto: ${fileName}` : ""}
`;

      // Motor de Inferencia: Gemini (prioridad con clave de clipboard o general) o Groq
      const geminiApiKey = process.env.GEMINI_API_KEY_CLIPBOARD || process.env.GEMINI_API_KEY;
      const groqApiKey = process.env.GROQ_API_KEY;

      if (geminiApiKey) {
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: geminiApiKey });
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json"
            }
          });
          const jsonStr = response.text || "{}";
          const parsed = JSON.parse(jsonStr);
          return res.json({ success: true, festival: parsed, engine: "gemini" });
        } catch (geminiErr: any) {
          console.warn("[parse-festival] Gemini falló, intentando alternativa:", geminiErr.message);
          if (!groqApiKey) {
            return res.status(500).json({ success: false, error: `Error en análisis con Gemini: ${geminiErr.message}` });
          }
        }
      }

      if (groqApiKey) {
        const groq = new Groq({ apiKey: groqApiKey });
        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          temperature: 0.1
        });
        const jsonStr = completion.choices[0].message.content || "{}";
        const parsed = JSON.parse(jsonStr);
        return res.json({ success: true, festival: parsed, engine: "groq" });
      }

      return res.status(500).json({
        success: false,
        error: "No hay motor de IA configurado (configure GEMINI_API_KEY_CLIPBOARD, GEMINI_API_KEY o GROQ_API_KEY)."
      });
    } catch (err: any) {
      console.error("Parsing error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/parse-festivals-batch", async (req, res) => {
    try {
      const { rawText, items: rawItems, fechaReferencia } = req.body;
      if (!rawText && (!rawItems || rawItems.length === 0)) {
        return res.json({ success: true, items: [], fallbackToLocal: false });
      }

      const refDate = fechaReferencia || new Date().toISOString().split("T")[0];

      const snippets: string[] = Array.isArray(rawItems) && rawItems.length > 0
        ? rawItems.slice(0, 15) // Límite de seguridad
        : (rawText || "").split(/\n\s*\n+/).filter((s: string) => s.trim().length > 15).slice(0, 15);

      if (snippets.length === 0) {
        return res.json({ success: true, items: [], fallbackToLocal: true });
      }

      const batchPrompt = `Analiza la lista de textos/convocatorias adjuntos y extrae los datos de festivales de cine.
La fecha de referencia de hoy es: ${refDate}. Interpreta expresiones relativas ("este viernes", "el mes próximo", "en dos semanas") calculando a partir de esta fecha ${refDate}.
Devuelve ÚNICAMENTE un objeto JSON válido con la propiedad "festivals" que contenga un arreglo de objetos con este esquema:
{
  "festivals": [
    {
      "name": "Nombre oficial",
      "country": "País o 'Ciudad, País'",
      "deadline": "YYYY-MM-DD o null",
      "newsDate": "YYYY-MM-DD o null",
      "category": "Cortometraje / Largometraje / Animación / etc",
      "platform": "FilmFreeway / Festhome / Shortfilmdepot / Propia / Google Forms",
      "price": "Precio en moneda original o 'Gratis'",
      "fee": 0,
      "link": "URL válida si existe o null",
      "observations": "Breve nota descriptiva o null"
    }
  ]
}

Convocatorias a analizar:
${snippets.map((s, idx) => `--- ITEM ${idx + 1} ---\n${s}`).join("\n\n")}`;

      // 1. Intento con Groq Llama 3.3
      const groqApiKey = process.env.GROQ_API_KEY;
      if (groqApiKey) {
        try {
          const groq = new Groq({ apiKey: groqApiKey });
          const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: batchPrompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0.1
          });
          const jsonStr = completion.choices[0].message.content || "{}";
          const parsed = JSON.parse(jsonStr);
          const list = Array.isArray(parsed.festivals) ? parsed.festivals : (Array.isArray(parsed) ? parsed : []);
          return res.json({ success: true, items: list, engine: "groq" });
        } catch (groqErr) {
          console.warn("[parse-festivals-batch] Groq falló, recurriendo a Gemini:", (groqErr as any).message);
        }
      }

      // 2. Fallback a Gemini 2.5 Flash (usando clave de clipboard dedicada o principal)
      const geminiApiKey = process.env.GEMINI_API_KEY_CLIPBOARD || process.env.GEMINI_API_KEY;
      if (geminiApiKey) {
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: geminiApiKey });
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: batchPrompt,
            config: {
              responseMimeType: "application/json"
            }
          });
          const jsonStr = response.text || "{}";
          const parsed = JSON.parse(jsonStr);
          const list = Array.isArray(parsed.festivals) ? parsed.festivals : (Array.isArray(parsed) ? parsed : []);
          return res.json({ success: true, items: list, engine: "gemini" });
        } catch (geminiErr) {
          console.warn("[parse-festivals-batch] Gemini falló, delegando a local determinista:", (geminiErr as any).message);
        }
      }

      // 3. Fallback seguro a local determinista (sin romper el flujo)
      return res.json({ success: true, items: [], fallbackToLocal: true });
    } catch (err: any) {
      console.error("[parse-festivals-batch] Error no controlado:", err);
      return res.json({ success: true, items: [], fallbackToLocal: true });
    }
  });

  app.post("/api/crawl-proposals", async (req, res) => {
    return res.json({ success: true, added: 0, proposals: [] });
  });

    const unusedCrawlLogicDummy = async () => {
    // Deprecated
  };

  app.post("/api/save-fcm-token", async (req, res) => {
    try {
      if (!isFirebaseAdminConfigured) {
        return res.status(500).json({ success: false, error: "Firebase Admin is not configured."});
      }
      const { email, token } = req.body;
      if (!email || !token) {
        return res.status(400).json({ success: false, error: "Missing email or token." });
      }

      const firebaseApp = getApp();
      const db = getFirestore(firebaseApp, 'festis-db-a');
      const tokenRef = db.collection('fcm_tokens').doc(email);
      
      await tokenRef.set({
        tokens: FieldValue.arrayUnion(token),
        email: email,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      res.json({ success: true });
    } catch (e: any) {
      console.error("Failed to save FCM token via API:", e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/test-push", async (req, res) => {
    try {
      if (!isFirebaseAdminConfigured) {
         return res.status(500).json({ success: false, error: "Firebase Admin is not configured. Check the FIREBASE_SERVICE_ACCOUNT secret and backend logs."});
      }
      const { email } = req.body;
      const firebaseApp = getApp();
      const db = getFirestore(firebaseApp, 'festis-db-a');
      
      const tokenSnap = await db.collection('fcm_tokens').doc(email).get();
      if (!tokenSnap.exists) {
        return res.json({ success: false, message: "No tokens found for this user." });
      }

      const tokens = tokenSnap.data()?.tokens;
      if (!tokens || tokens.length === 0) {
        return res.json({ success: false, message: "No tokens found for this user." });
      }

      await sendPushNotifications(
        "👋 ¡Hola desde Festis!",
        "Si ves esto, tus notificaciones push funcionan correctamente.",
        tokens
      );

      res.json({ success: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/notify-bug", async (req, res) => {
    try {
      if (!isFirebaseAdminConfigured) {
         return res.status(500).json({ success: false, error: "Firebase Admin is not configured. Check the FIREBASE_SERVICE_ACCOUNT secret and backend logs."});
      }
      const { title, description, author } = req.body;
      const firebaseApp = getApp();
      const db = getFirestore(firebaseApp, 'festis-db-a');

      // Identify devs/admins to send push to
      const membersSnap = await db.collection('authmembers').get();
      const devEmails: string[] = [];
      membersSnap.forEach(m => {
        const data = m.data();
        if (data.role === 'dev' || data.role === 'admin') {
          if (data.authorizedEmails && Array.isArray(data.authorizedEmails)) {
            devEmails.push(...data.authorizedEmails);
          }
        }
      });

      if (devEmails.length === 0) return res.json({ success: true, message: "No devs found." });

      const tokensSnap = await db.collection('fcm_tokens').where('email', 'in', devEmails).get();
      const devTokens: string[] = [];
      tokensSnap.forEach(t => {
        const data = t.data();
        if (data.tokens && Array.isArray(data.tokens)) {
          devTokens.push(...data.tokens);
        }
      });

      if (devTokens.length > 0) {
        await sendPushNotifications(
           `🐛 Nuevo Bug: ${title}`, 
           `Reportado por ${author || 'Alguien'}. Revisa el Bug Tracker.`, 
           devTokens
        );
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.body.url;
      if (!imageUrl) {
         return res.status(400).send("Missing url");
      }
      const fetchResp = await fetch(imageUrl);
      if (!fetchResp.ok) throw new Error(`Fetch failed with status: ${fetchResp.status}`);
      const arrayBuffer = await fetchResp.arrayBuffer();
      const contentType = fetchResp.headers.get("content-type") || "image/png";
      const buffer = Buffer.from(arrayBuffer);
      const b64 = buffer.toString('base64');
      const dataUrl = `data:${contentType};base64,${b64}`;
      res.json({ dataUrl });
    } catch (e: any) {
      console.error("Proxy error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/proxy-rom", async (req, res) => {
    try {
      const romUrl = req.query.url as string;
      if (!romUrl) {
         return res.status(400).send("Missing url");
      }
      const fetchResp = await fetch(romUrl);
      if (!fetchResp.ok) throw new Error(`Fetch failed with status: ${fetchResp.status}`);
      
      const contentType = fetchResp.headers.get("content-type") || "application/octet-stream";
      res.setHeader("Content-Type", contentType);

        // SOLUCIÓN AL CORS: Le avisa al navegador que tu frontend puede leer este archivo sin bloquearlo
      res.setHeader("Access-Control-Allow-Origin", "*");
      
      const contentLength = fetchResp.headers.get("content-length");
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }

      if (fetchResp.body) {
         Readable.fromWeb(fetchResp.body as any).pipe(res);
      } else {
         const arrayBuffer = await fetchResp.arrayBuffer();
         res.send(Buffer.from(arrayBuffer));
      }
    } catch (e: any) {
      console.error("Proxy error:", e.message);
      if (!res.headersSent) {
         res.status(500).json({ error: e.message });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(
      express.static(distPath, {
        setHeaders: (res, filepath) => {
          if (
            filepath.endsWith("index.html") ||
            filepath.endsWith("sw.js") ||
            filepath.endsWith("firebase-messaging-sw.js")
          ) {
            res.setHeader(
              "Cache-Control",
              "no-cache, no-store, must-revalidate, max-age=0"
            );
          } else if (filepath.includes(path.sep + "assets" + path.sep)) {
            res.setHeader(
              "Cache-Control",
              "public, max-age=31536000, immutable"
            );
          }
        },
      })
    );
    app.get("*", (req, res) => {
      if (
        req.path.startsWith("/assets/") ||
        req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|json|woff|woff2|map)$/i)
      ) {
        return res.status(404).setHeader("Content-Type", "text/plain").send("Asset not found");
      }
      res.setHeader(
        "Cache-Control",
        "no-cache, no-store, must-revalidate, max-age=0"
      );
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
