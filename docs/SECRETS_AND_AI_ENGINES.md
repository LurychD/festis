# SECRETS, MOTORES DE IA Y PARSEO EN FESTIS

Este documento registra la arquitectura definitiva de secrets, variables de entorno y motores de inteligencia artificial integrados en la aplicación Festis.

---

## 1. PRINCIPIOS DE ARQUITECTURA Y SEGURIDAD

1. **Aislamiento de Secrets en Backend**:
   - Ninguna clave de API privada (`GEMINI_API_KEY`, `GEMINI_API_KEY_CLIPBOARD`, `GROQ_API_KEY`, `FIREBASE_SERVICE_ACCOUNT`) se inyecta ni se consume en el frontend (`src/`).
   - El frontend consume exclusivamente endpoints proxy seguros autenticados (`/api/parse-festival`, `/api/parse-festivals-batch`).

2. **Multimedia 100% en Cliente**:
   - Festis no procesa imágenes pesadas ni realiza OCR en el servidor. Toda compresión y manipulación multimedia se ejecuta en el navegador mediante HTML5 Canvas y Web APIs locales antes de la persistencia en Firebase Storage.
   - En consecuencia, se eliminaron completamente las integraciones obsoletas o externas no utilizadas (Hugging Face y endpoints de Gemini Spark / Gem integration), reduciendo la superficie de ataque y simplificando el backend.

---

## 2. INVENTARIO DE SECRETS Y VARIABLES DE ENTORNO

| Variable | Ámbito | Descripción y Uso | Criticidad |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Backend (`server.ts`) | Clave general de Google Gemini para inferencia estructurada y batch parsing. | Alta |
| `GEMINI_API_KEY_CLIPBOARD` | Backend (`server.ts`) | Clave secundaria de Gemini dedicada a operaciones de parseo de portapapeles y textos de convocatorias (evita el agotamiento de cuota de la clave principal). | Opcional / Recomendada |
| `GROQ_API_KEY` | Backend (`server.ts`) | Acceso a Llama 3.3 (70B) para parseo de festivales y fallback de contingencia. | Media |
| `FIREBASE_SERVICE_ACCOUNT` | Backend (`server.ts`) | Credenciales JSON de Firebase Admin SDK para sincronización y Cloud Messaging (FCM). | Crítica |
| `VITE_FCM_VAPID_KEY` | Frontend (`src/`) | Clave pública VAPID para registro de suscripciones Push Web. | Opcional |

---

## 3. FLUJO DE PARSEO DE FESTIVALES Y PORTAPAPELES

El sistema opera con dos niveles complementarios de procesamiento:

1. **Nivel 1: Motor Determinista Local (`src/utils/clipboardFestivalParser.ts`)**:
   - Se ejecuta 100% en el cliente sin latencia ni consumo de red o cuotas de API.
   - Aplica 870 líneas de heurísticas, deduplicación de 5 capas, catálogo de semillas canónicas (`src/data/seed/`) y sellos de calidad (Oscar, FIAPF, INCAA, Goya).
   - Maneja el botón de portapapeles en `FestivalModal.tsx` con fallback reactivo ante restricciones de `Permissions-Policy` en iframes.

2. **Nivel 2: Inferencia de Backend (`/api/parse-festival` y `/api/parse-festivals-batch`)**:
   - Utilizado para textos no estructurados o análisis masivo.
   - Prioriza `GEMINI_API_KEY_CLIPBOARD` si está definida; si no, utiliza `GEMINI_API_KEY`.
   - Si Gemini no está disponible o falla, recurre a `GROQ_API_KEY` (Llama 3.3).
   - Si no hay servicios de IA externos o todos fallan, se realiza una degradación elegante devolviendo `fallbackToLocal: true`.
