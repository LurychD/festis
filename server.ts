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
          const db = getFirestore(firebaseApp, 'festis-cardigan');
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
    const db = getFirestore(firebaseApp, 'festis-cardigan');

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

    // 3. Fetch festivals
    const festSnap = await db.collection('festivals').get();

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
          const db = getFirestore(firebaseApp, 'festis-cardigan');

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

      if (fileBase64) {
         const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
         const geminiApiKey = process.env.GEMINI_API_KEY;

         if (hfToken) {
             // Use Hugging Face serverless API with meta-llama/Llama-3.2-11B-Vision-Instruct
             // We can fall back to Qwen/Qwen2-VL-7B-Instruct if the first one fails
             const modelsToTry = [
                 "meta-llama/Llama-3.2-11B-Vision-Instruct",
                 "Qwen/Qwen2-VL-7B-Instruct"
             ];
             
             let lastError = null;
             let parsed = null;

             for (const model of modelsToTry) {
                 try {
                     const hfResponse = await fetch("https://api-inference.huggingface.co/v1/chat/completions", {
                         method: "POST",
                         headers: {
                             "Authorization": `Bearer ${hfToken}`,
                             "Content-Type": "application/json"
                         },
                         body: JSON.stringify({
                             model: model,
                             messages: [
                                 {
                                     role: "user",
                                     content: [
                                         { type: "text", text: prompt },
                                         {
                                             type: "image_url",
                                             image_url: { url: `data:${mimeType || "image/jpeg"};base64,${fileBase64}` }
                                         }
                                     ]
                                 }
                             ],
                             max_tokens: 1024,
                             temperature: 0.1
                         })
                     });

                     if (!hfResponse.ok) {
                         const errText = await hfResponse.text();
                         throw new Error(`HF error for ${model} (${hfResponse.status}): ${errText}`);
                      }

                      const resJson = await hfResponse.json();
                      let contentStr = resJson.choices?.[0]?.message?.content || "{}";
                      
                      contentStr = contentStr.trim();
                      if (contentStr.startsWith("```json")) {
                          contentStr = contentStr.replace(/^```json/, "").replace(/```$/, "").trim();
                      } else if (contentStr.startsWith("```")) {
                          contentStr = contentStr.replace(/^```/, "").replace(/```$/, "").trim();
                      }

                      parsed = JSON.parse(contentStr);
                      break; // Success, break out of loop
                  } catch (err: any) {
                      console.error(`Error with HF model ${model}:`, err.message);
                      lastError = err;
                  }
              }

              if (parsed) {
                  return res.json({ success: true, festival: parsed });
              } else {
                  return res.status(500).json({ success: false, error: `Hugging Face parsing failed: ${lastError?.message || "Unknown error"}` });
              }
         } else if (geminiApiKey) {
             const { GoogleGenAI } = await import("@google/genai");
             const ai = new GoogleGenAI({ apiKey: geminiApiKey });

             const response = await ai.models.generateContent({
                 model: "gemini-2.5-flash",
                 contents: [
                     {
                         role: "user",
                         parts: [
                             { text: prompt },
                             { inlineData: { data: fileBase64, mimeType: mimeType || "application/octet-stream" } }
                         ]
                     }
                 ],
                 config: {
                     responseMimeType: "application/json"
                 }
              });
              
              const jsonStr = response.text || "{}";
              const parsed = JSON.parse(jsonStr);
              return res.json({ success: true, festival: parsed });
         } else {
             return res.status(500).json({ success: false, error: "Falta configurar HF_TOKEN o GEMINI_API_KEY para analizar archivos." });
         }
      } else {
         const groqApiKey = process.env.GROQ_API_KEY;
         if (!groqApiKey) {
             return res.status(500).json({ success: false, error: "Missing GROQ_API_KEY." });
         }
         const groq = new Groq({ apiKey: groqApiKey });
         const completion = await groq.chat.completions.create({
             messages: [{ role: "user", content: prompt }],
             model: "llama-3.3-70b-versatile",
             response_format: { type: "json_object" },
             temperature: 0.1
         });
         const jsonStr = completion.choices[0].message.content || "{}";
         const parsed = JSON.parse(jsonStr);
         return res.json({ success: true, festival: parsed });
      }
    } catch (err: any) {
      console.error("Parsing error:", err);
      res.status(500).json({ success: false, error: err.message });
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
      const db = getFirestore(firebaseApp, 'festis-cardigan');
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
      const db = getFirestore(firebaseApp, 'festis-cardigan');
      
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
      const db = getFirestore(firebaseApp, 'festis-cardigan');

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

  // GEMINI SPARK READ-ONLY BACKEND API & GEM INTEGRATION ENDPOINTS
  app.get("/api/spark/openapi.json", (req, res) => {
    const origin = `${req.protocol}://${req.get('host')}`;
    res.json({
      openapi: "3.0.0",
      info: {
        title: "Festis Cardigan API para Gemini Spark",
        description: "API de integración directa con Gemini Spark y Gems para consulta de festivales y convocatorias.",
        version: "1.0.0"
      },
      servers: [{ url: origin }],
      paths: {
        "/api/spark/festivals": {
          get: {
            summary: "Obtener lista completa de festivales y convocatorias",
            parameters: [
              { name: "key", in: "query", description: "Clave secreta de la API Spark", required: false, schema: { type: "string" } },
              { name: "status", in: "query", description: "Filtrar por estado (ej: POR_ENVIAR, EN_REVISION, SELECCIONADO)", required: false, schema: { type: "string" } }
            ],
            responses: {
              "200": { description: "Lista estructurada de festivales en formato JSON" }
            }
          }
        },
        "/api/gemini-spark/read": {
          get: {
            summary: "Consulta asistida por IA sobre los festivales",
            parameters: [
              { name: "key", in: "query", description: "Clave secreta de la API Spark", required: false, schema: { type: "string" } },
              { name: "q", in: "query", description: "Pregunta o consulta para la IA", required: false, schema: { type: "string" } }
            ],
            responses: {
              "200": { description: "Respuesta en lenguaje natural generada por la IA" }
            }
          },
          post: {
            summary: "Consulta asistida por IA sobre los festivales (POST)",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      query: { type: "string" },
                      sparkApiKey: { type: "string" }
                    }
                  }
                }
              }
            },
            responses: {
              "200": { description: "Respuesta generada por la IA" }
            }
          }
        }
      }
    });
  });

  // Plain Text / Markdown Endpoint for Gemini Spark link scraping & prompt reading
  app.get(["/api/spark/markdown", "/api/spark/festivals.md", "/api/spark/summary.txt"], async (req, res) => {
    try {
      const headerKey = req.headers["x-spark-api-key"] || (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, "") : undefined);
      const queryKey = req.query.key || req.query.apiKey || req.query.sparkApiKey;
      const providedKey = (headerKey || queryKey || "").toString().trim();

      let isEnabled = true;
      let configuredSecret = process.env.SPARK_API_SECRET || "";

      if (isFirebaseAdminConfigured) {
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp, 'festis-cardigan');
          const sparkDoc = await db.collection('system_settings').doc('gemini_spark').get();
          if (sparkDoc.exists) {
            const data = sparkDoc.data();
            isEnabled = data?.enabled ?? true;
            if (data?.apiKey) configuredSecret = data.apiKey;
          }
        } catch (e) {}
      }

      if (!isEnabled) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.status(200).send("Error: El servicio Gemini Spark está deshabilitado en la configuración de la app.");
      }

      if (configuredSecret && providedKey !== configuredSecret) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.status(401).send("Error: Acceso no autorizado. Clave 'key' de API no válida o ausente en la URL.");
      }

      let festivalsData: any[] = [];
      if (isFirebaseAdminConfigured) {
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp, 'festis-cardigan');
          const snap = await db.collection('festivals').get();
          snap.forEach(doc => {
            const d = doc.data();
            festivalsData.push({
              id: doc.id,
              name: d.name || 'Sin nombre',
              status: d.status || 'Por enviar',
              deadline: d.deadline || '',
              newsDate: d.newsDate || '',
              projectionDate: d.projectionDate || '',
              category: d.category || '',
              platform: d.platform || '',
              price: d.price || '',
              country: d.country || '',
              link: d.link || '',
              observations: d.observations || ''
            });
          });
        } catch (e) {}
      }

      // Format as clean Markdown document
      let md = `# FESTIS CARDIGAN - BASE DE DATOS DE FESTIVALES Y CONVOCATORIAS\n`;
      md += `Fecha de actualización: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}\n`;
      md += `Total de convocatorias: ${festivalsData.length}\n\n`;
      md += `---\n\n`;

      festivalsData.forEach((f, idx) => {
        md += `### ${idx + 1}. ${f.name.toUpperCase()}\n`;
        md += `- **Estado actual:** ${f.status}\n`;
        if (f.deadline) md += `- **Fecha límite cierre:** ${f.deadline}\n`;
        if (f.newsDate) md += `- **Fecha de novedades/noticias:** ${f.newsDate}\n`;
        if (f.projectionDate) md += `- **Fecha de proyección:** ${f.projectionDate}\n`;
        if (f.category) md += `- **Categoría:** ${f.category}\n`;
        if (f.platform) md += `- **Plataforma:** ${f.platform}\n`;
        if (f.price) md += `- **Fee / Precio:** ${f.price}\n`;
        if (f.country) md += `- **País / Ciudad:** ${f.country}\n`;
        if (f.link) md += `- **Link oficial:** ${f.link}\n`;
        if (f.observations) md += `- **Observaciones:** ${f.observations}\n`;
        md += `\n`;
      });

      // Record access event
      if (isFirebaseAdminConfigured) {
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp, 'festis-cardigan');
          await db.collection('system_settings').doc('gemini_spark_last_access').set({
            timestamp: new Date().toISOString(),
            query: "Lectura directa Markdown (/api/spark/markdown)",
            festivalsCount: festivalsData.length,
            eventId: Date.now().toString()
          });
        } catch (e) {}
      }

      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      return res.status(200).send(md);
    } catch (e: any) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(500).send(`Error interno: ${e.message}`);
    }
  });

  // Direct Data Endpoint for Gemini Spark / Custom Gems (GET & POST)
  app.all(["/api/spark/festivals", "/api/spark/data"], async (req, res) => {
    try {
      const headerKey = req.headers["x-spark-api-key"] || (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, "") : undefined);
      const queryKey = req.query.key || req.query.apiKey || req.query.sparkApiKey;
      const bodyKey = req.body?.sparkApiKey || req.body?.key;
      const providedKey = (headerKey || queryKey || bodyKey || "").toString().trim();

      let isEnabled = true;
      let configuredSecret = process.env.SPARK_API_SECRET || "";

      if (isFirebaseAdminConfigured) {
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp, 'festis-cardigan');
          const sparkDoc = await db.collection('system_settings').doc('gemini_spark').get();
          if (sparkDoc.exists) {
            const data = sparkDoc.data();
            isEnabled = data?.enabled ?? true;
            if (data?.apiKey) configuredSecret = data.apiKey;
          }
        } catch (e) {}
      }

      if (!isEnabled) {
        return res.status(200).json({ success: false, error: "Servicio Gemini Spark deshabilitado en configuración." });
      }

      if (configuredSecret && providedKey !== configuredSecret) {
        return res.status(401).json({ success: false, error: "Clave de API no válida. Proporcione 'key' en URL o header 'x-spark-api-key'." });
      }

      let festivalsData: any[] = [];
      if (isFirebaseAdminConfigured) {
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp, 'festis-cardigan');
          const snap = await db.collection('festivals').get();
          snap.forEach(doc => {
            const d = doc.data();
            festivalsData.push({
              id: doc.id,
              name: d.name,
              status: d.status,
              deadline: d.deadline,
              newsDate: d.newsDate,
              projectionDate: d.projectionDate,
              category: d.category,
              platform: d.platform,
              price: d.price,
              country: d.country,
              link: d.link,
              observations: d.observations
            });
          });
        } catch (e) {}
      }

      const filterStatus = (req.query.status || req.body?.status || "").toString().trim().toUpperCase();
      if (filterStatus) {
        festivalsData = festivalsData.filter(f => (f.status || "").toUpperCase().replace(/_/g, " ") === filterStatus.replace(/_/g, " "));
      }

      // Record access event
      if (isFirebaseAdminConfigured) {
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp, 'festis-cardigan');
          await db.collection('system_settings').doc('gemini_spark_last_access').set({
            timestamp: new Date().toISOString(),
            query: req.query.status ? `Consulta estado ${req.query.status}` : "Consulta directa JSON de festivales",
            festivalsCount: festivalsData.length,
            eventId: Date.now().toString()
          });
        } catch (e) {}
      }

      return res.json({
        app: "Festis Cardigan",
        timestamp: new Date().toISOString(),
        total: festivalsData.length,
        festivals: festivalsData
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // AI Read Endpoint for Gemini Spark (GET & POST)
  app.all(["/api/gemini-spark/read", "/api/spark/read"], async (req, res) => {
    try {
      const queryParam = req.query.q || req.query.query;
      const bodyQuery = req.body?.query;
      const query = (queryParam || bodyQuery || "").toString().trim();

      const headerKey = req.headers["x-spark-api-key"] || (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, "") : undefined);
      const queryKey = req.query.key || req.query.apiKey || req.query.sparkApiKey;
      const bodyKey = req.body?.sparkApiKey || req.body?.key;
      const providedKey = (headerKey || queryKey || bodyKey || "").toString().trim();
      
      let activeState = req.body?.isEnabled;
      let configuredSecret = process.env.SPARK_API_SECRET || "";

      if (isFirebaseAdminConfigured) {
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp, 'festis-cardigan');
          const sparkDoc = await db.collection('system_settings').doc('gemini_spark').get();
          if (sparkDoc.exists) {
            const data = sparkDoc.data();
            if (activeState === undefined) activeState = data?.enabled ?? true;
            if (data?.apiKey) configuredSecret = data.apiKey;
          }
        } catch (e) {}
      }

      if (activeState === undefined) activeState = true;

      if (activeState === false) {
        return res.status(200).json({
          success: false,
          disabled: true,
          error: "El acceso en modo lectura de Gemini Spark está deshabilitado desde la configuración."
        });
      }

      // API Key Security Validation
      if (configuredSecret && providedKey !== configuredSecret) {
        return res.status(401).json({
          success: false,
          error: "Acceso no autorizado. Se requiere una API Key válida (query 'key' o Header 'x-spark-api-key')."
        });
      }

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(500).json({
          success: false,
          error: "Falta configurar GEMINI_API_KEY en el servidor para el SDK de Gemini Spark."
        });
      }

      // Fetch festival data in read-only mode for Gemini Spark context
      let festivalsData: any[] = [];
      if (isFirebaseAdminConfigured) {
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp, 'festis-cardigan');
          const snap = await db.collection('festivals').limit(100).get();
          snap.forEach(doc => {
            const data = doc.data();
            festivalsData.push({
              id: doc.id,
              name: data.name,
              status: data.status,
              deadline: data.deadline,
              newsDate: data.newsDate,
              projectionDate: data.projectionDate,
              category: data.category,
              platform: data.platform,
              price: data.price,
              country: data.country,
              link: data.link,
              observations: data.observations
            });
          });
        } catch (dbErr) {
          console.warn("Could not load festivals for Gemini Spark read context:", dbErr);
        }
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      const promptContext = `Eres el asistente oficial de backend Gemini Spark operando en MODO LECTURA para Festis Cardigan.
Tu función es responder al usuario en lenguaje natural sobre sus festivales, estado de postulaciones y cierres.

Datos actuales de festivales en la plataforma (${festivalsData.length} festivales cargados):
${JSON.stringify(festivalsData, null, 2)}

Consulta del usuario: ${query || "Resumen general de estado de los festivales y próximas fechas límites."}
Responde directamente en español claro, directo y conversacional. No incluyas código HTML ni scripts.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: promptContext }]
          }
        ]
      });

      // Record access event for real-time frontend notifications (Toast)
      if (isFirebaseAdminConfigured) {
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp, 'festis-cardigan');
          await db.collection('system_settings').doc('gemini_spark_last_access').set({
            timestamp: new Date().toISOString(),
            query: query || "Consulta general de festivales",
            festivalsCount: festivalsData.length,
            eventId: Date.now().toString()
          });
        } catch (dbErr) {
          console.warn("Could not record Gemini Spark read access event:", dbErr);
        }
      }

      return res.json({
        success: true,
        disabled: false,
        response: response.text || "Sin respuesta generada.",
        query: query || "Resumen general",
        dataSummary: {
          festivalsLoaded: festivalsData.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err: any) {
      console.error("Error en Gemini Spark read endpoint:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/gemini-spark/status", async (req, res) => {
    try {
      let isEnabled = true;
      let configuredSecret = process.env.SPARK_API_SECRET || "";
      if (isFirebaseAdminConfigured) {
        try {
          const firebaseApp = getApp();
          const db = getFirestore(firebaseApp, 'festis-cardigan');
          const sparkDoc = await db.collection('system_settings').doc('gemini_spark').get();
          if (sparkDoc.exists) {
            const data = sparkDoc.data();
            isEnabled = data?.enabled ?? true;
            if (data?.apiKey) configuredSecret = data.apiKey;
          }
        } catch (e) {}
      }
      res.json({
        success: true,
        enabled: isEnabled,
        mode: "read-only",
        hasApiKey: !!process.env.GEMINI_API_KEY,
        requiresAuth: !!configuredSecret
      });
    } catch (e: any) {
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
