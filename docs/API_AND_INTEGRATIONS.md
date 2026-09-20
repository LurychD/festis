# APIs, Integraciones, Secrets y Alternativas de Autenticación / Almacenamiento

Este documento contiene la especificación técnica completa del ecosistema de integraciones externas, variables de entorno (secrets), APIs utilizadas por la aplicación y las guías de arquitectura para sustituir los servicios predeterminados (Firebase Auth / Firebase Storage) por alternativas de la industria (Auth0, Supabase Auth, AWS S3, Cloudflare R2, MinIO).

---

## 🔐 1. Inventario de Variables de Entorno y Secrets

Todas las claves secretas y parámetros de entorno están declarados en `.env.example`. Por razones de seguridad, las claves sensibles **NUNCA** se incluyen en el repositorio ni se exponen al cliente.

### Tabla Completa de Secrets y Variables

| Variable | Tipo | Ámbito | Descripción | Requerido |
| :--- | :--- | :--- | :--- | :---: |
| `GEMINI_API_KEY` | Secret | Servidor (`server.ts`) | Clave para llamadas al SDK de Google Gemini GenAI (@google/genai). Generación de copys para Instagram, resúmenes y asistencia. | Sí |
| `GROQ_API_KEY` | Secret | Servidor (`server.ts`) | API Key de Groq para procesamiento de LLM ultra-rápido y parsing sintáctico de convocatorias. | Opcional |
| `HF_TOKEN` | Secret | Servidor (`server.ts`) | API Token de Hugging Face para lectura visual de afiches y flyers de festivales (Llama 3.2 Vision). | Opcional |
| `FIREBASE_SERVICE_ACCOUNT` | Secret (JSON) | Servidor (`server.ts`) | Credenciales administrativas para operaciones con privilegios en Firestore y Push Notifications (Firebase Admin SDK). | Sí |
| `VITE_FCM_VAPID_KEY` | Pública | Cliente (React) | Clave pública VAPID requerida por el navegador para suscribir el dispositivo a Firebase Cloud Messaging. | Opcional |
| `VITE_GOOGLE_MAPS_API_KEY` | Pública | Cliente (React) | Clave para el servicio de autocompletado de ciudades y sedes de festivales (`PlaceAutocomplete.tsx`). | Opcional |
| `APP_URL` | Config | Ambos | URL del servicio en Cloud Run. Inyectada automáticamente en tiempo de ejecución. | Sí |

---

## 🔌 2. Inventario Completo de APIs e Integraciones Utilizadas

Festis Cardigan hace uso de las siguientes APIs y librerías de servicio:

1. **Google Gemini GenAI API (`@google/genai`) y Gemini Spark Integración Móvil:**
   - **Uso:** Procesamiento de lenguaje natural, generación automatizada de textos promocionales de prensa para redes sociales (`InstagramSimulator.tsx`), extracción estructurada de datos de convocatorias y servicio SDK Gemini Spark Backend para consultas directas desde dispositivos móviles (Gemini Spark en celular).
   - **Endpoints Disponibles:**
     * `GET /api/spark/markdown?key=SPARK_KEY`: Devuelve la lista completa de festivales en documento Markdown limpio (`text/markdown; charset=utf-8`). Ideal para que Gemini Spark desde el celular raspe y procese la información al instante sin dar errores de renderizado ni intentar abrir páginas web.
     * `GET /api/spark/festivals?key=SPARK_KEY`: Devuelve la lista estructurada de festivales en formato JSON plano directo. Admite filtros como `?status=POR_ENVIAR`.
     * `GET/POST /api/gemini-spark/read?key=SPARK_KEY&q=...`: Endpoint de consulta asistida por IA que analiza la base de datos y responde conversacionalmente en lenguaje natural.
     * `GET /api/spark/openapi.json`: Especificación OpenAPI 3.0 para importar la API como una Custom Action.
     * `GET /api/gemini-spark/status`: Verifica el estado de activación del servicio.
   - **Conexión Directa desde Gemini Spark Móvil:**
     Para consultar a Gemini Spark desde el celular sin abrir interfaces web ni provocar errores de navegación:
     1. Ve a `Configuración > Servicios` y presiona **"Copiar Link Markdown (.md)"** o **"Copiar Prompt Spark"**.
     2. En el chat de Gemini Spark en tu celular, pega el mensaje o el link.
     3. Gemini Spark consumirá el documento `.md` en tiempo real y responderá tu duda sobre festivales de forma inmediata.
   - **Notificaciones Flotantes (Toasts):** Cuando Gemini Spark consulta la aplicación en tiempo real, se muestra una notificación Toast animada (`GeminiSparkToast.tsx`) indicando la consulta recibida.
   - **Seguridad y Almacenamiento de API Key:** Acepta la clave enviada como parámetro de consulta URL (`?key=...`), en el encabezado `x-spark-api-key` o en `Authorization: Bearer <key>`. La clave se resguarda en Firestore (`system_settings/gemini_spark`) y en el `localStorage` del navegador.

2. **Groq Llama 3 / Hugging Face Vision API:**
   - **Uso:** OCR de afiches y flyers visuales subidos por el usuario en formatos JPG/PNG para autocompletar formularios.

3. **Google Maps Platform (Places Autocomplete API):**
   - **Uso:** Sugerencias geográficas de ciudades y teatros/sedes en tiempo real dentro de `PlaceAutocomplete.tsx` y proyección en `MapReportModal.tsx`.

4. **Firebase Cloud Firestore API (`firebase/firestore`):**
   - **Uso:** Sincronización reactiva de datos en tiempo real mediante sockets `onSnapshot()`.

5. **Servicio Backend de Recuperación 2FA por Email & SMS (`/api/send-2fa-recovery-code`):**
   - **Uso:** Generación y despacho backend de códigos OTP temporales de 6 dígitos hacia el correo electrónico (`userEmail`) y teléfono móvil (`userPhone`) registrado por el usuario, además de notificaciones Push web vía FCM.
   - **Endpoint:** POST `/api/send-2fa-recovery-code` con payload `{ email, phone, code }`. Registra la auditoría en Firestore (`audit_logs`) y retorna confirmación del despacho.

6. **Firebase Cloud Messaging (FCM Push Notifications API):**
   - **Uso:** Envío de alertas push web a dispositivos móviles cuando se aproxima la fecha límite de un festival.

6. **Google Drive API / Drive Embeds (`DriveFolderExplorer.tsx`):**
   - **Uso:** Inspección incrustada de carpetas compartidas de Google Drive para visualización directa de press kits, trailers y dossiers.

7. **Recharts & D3 Data Visualization Engine:**
   - **Uso:** Renderizado vectorial de gráficos interactivos de velocidad de respuesta, distribución por estado e inversión de fees (`StatsView.tsx`, `StatusVelocityReport.tsx`).

8. **Export & Client Data APIs (jspdf, html2canvas, papaparse):**
   - **Uso:** Generación cliente de dossiers en PDF y exportaciones estructuradas en CSV/Excel (`ReportsView.tsx`).

---

## 🔑 3. Guía de Migración: Autenticación Alternativa (Auth0, Supabase Auth, Custom JWT)

Si se desea desvincular la aplicación de Firebase Auth y Google Sign-In, se debe sustituir la capa de sesión en `src/services/firebase.ts` y `App.tsx`:

### opción A: Integración con Auth0
1. Instalar el SDK: `npm install @auth0/auth0-react`
2. Envolver la aplicación en `main.tsx`:
   ```tsx
   import { Auth0Provider } from "@auth0/auth0-react";

   <Auth0Provider
     domain={import.meta.env.VITE_AUTH0_DOMAIN}
     clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
     authorizationParams={{ redirect_uri: window.location.origin }}
   >
     <App />
   </Auth0Provider>
   ```
3. En los componentes, consumir el hook `useAuth0()` reemplazando `onAuthStateChanged()`:
   ```tsx
   const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();
   ```

### Opción B: Integración con Supabase Auth
1. Instalar cliente: `npm install @supabase/supabase-js`
2. Inicializar cliente en `src/services/supabase.ts`:
   ```typescript
   import { createClient } from "@supabase/supabase-js";

   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   );
   ```
3. Suscribirse a cambios de sesión:
   ```typescript
   supabase.auth.onAuthStateChange((event, session) => {
     setUser(session?.user ?? null);
   });
   ```

---

## ☁️ 4. Guía de Migración: Almacenamiento de Archivos Multimedia Alternativo (AWS S3, Cloudflare R2, MinIO)

Actualmente, las imágenes de afiches, fotogramas y laureles pueden guardarse en Firebase Storage. Para usar un proveedor de almacenamiento de objetos estándar S3:

### Opción A: AWS S3 / Cloudflare R2 / MinIO (Servidor Backend Express)
1. Instalar SDK cliente de AWS: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
2. Crear un endpoint en `server.ts` para obtener URLs firmadas de carga (Presigned Upload URLs):

   ```typescript
   import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
   import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

   const s3 = new S3Client({
     region: process.env.AWS_REGION || "auto",
     endpoint: process.env.S3_ENDPOINT, // Requerido para Cloudflare R2 o MinIO
     credentials: {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
     },
   });

   app.post("/api/upload-url", async (req, res) => {
     const { filename, contentType } = req.body;
     const command = new PutObjectCommand({
       Bucket: process.env.S3_BUCKET_NAME,
       Key: `posters/${Date.now()}_${filename}`,
       ContentType: contentType,
     });

     const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
     res.json({ uploadUrl: url, publicUrl: `${process.env.S3_PUBLIC_CDN}/${command.input.Key}` });
   });
   ```

3. **Subida desde React (`FestivalModal.tsx` / `GalleryView.tsx`):**
   ```typescript
   async function uploadFileToS3(file: File) {
     const res = await fetch("/api/upload-url", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ filename: file.name, contentType: file.type }),
     });
     const { uploadUrl, publicUrl } = await res.json();

     // Subida directa al bucket S3 / Cloudflare R2 sin saturar el servidor
     await fetch(uploadUrl, {
       method: "PUT",
       headers: { "Content-Type": file.type },
       body: file,
     });

     return publicUrl; // URL estática servida por CDN
   }
   ```
