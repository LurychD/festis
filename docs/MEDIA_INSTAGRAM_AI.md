# Integración de IA (Gemini), Análisis de Afiches y Difusión Social — Guía Técnica

Este documento especifica la integración de los modelos de Inteligencia Artificial de Google Gemini (`@google/genai`), el módulo de reconocimiento y OCR de afiches cinematográficos y el generador de kits de prensa e Instagram en **Festis Cardigan**.

---

## 🤖 1. Arquitectura de Inteligencia Artificial (Google Gemini)

La aplicación utiliza el SDK oficial de **Google Gen AI** (`@google/genai`) para potenciar múltiples funcionalidades de análisis automático, redacción de sinopsis y generación de contenido promocional.

### Principales Usos de IA en el Sistema:

1. **Lectura y OCR de Afiches / Convocatorias:** Analiza afiches de festivales o capturas de pantalla de la web para extraer automáticamente el nombre del festival, fechas límite, requisitos de duración y costos de inscripción.
2. **Generador de Copys para Redes Sociales:** Redacta publicaciones optimizadas para Instagram, Facebook, X (Twitter) y LinkedIn anunciando selecciones oficiales o premios obtenidos.
3. **Servicio Backend SDK Gemini Spark (Modo Lectura):** Proporciona un canal backend proxy (`POST /api/gemini-spark/read`) para consultar y procesar los datos de Festis Cardigan sin modificar la base de datos de Firestore. Este acceso se gestiona desde `Configuración > Servicios`, donde la clave secreta de autenticación (`x-spark-api-key`) se resguarda en la colección `system_settings/gemini_spark` de Firestore (base de datos `festis-cardigan`) y en el `localStorage` local.
   - *Prompt de Conexión y Nota de Entorno (Preview vs Deploy):* Especifica explícitamente a Gemini Spark que el enlace utilizado actualmente corresponde a la preview en AI Studio y que será actualizado con la URL definitiva de Cloud Run al realizar el despliegue final a producción.
4. **Redactor Inteligente de Reportes Ejecutivos:** Genera resúmenes sintéticos en lenguaje natural para ser incluidos en los dossiers PDF de presentación ante institutos de cine (INCAA, ICAA).
5. **Traducción y Localización de Sinopsis:** Adapta la sinopsis técnica de la película al inglés, francés y español neutro.

---

## 📸 2. Análisis de Afiches y Visión por Computadora

Ubicación del Servicio: `src/utils/helpers.ts` y componentes de carga de archivos.

Cuando el usuario arrastra la imagen de un afiche o volante promocional de un festival, el sistema ejecuta un flujo multimodal que procesa la imagen Base64:

```typescript
// Fragmento simplificado del análisis multimodal con Gemini API
import { GoogleGenAI } from '@google/genai';

export const extractFestivalDataFromPoster = async (base64Image: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada.');
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] // Elimina el encabezado Data URL
            }
          },
          {
            text: 'Extrae en formato JSON los siguientes datos del afiche del festival de cine: name, city, country, deadline (YYYY-MM-DD), feeUsd, category.'
          }
        ]
      }
    ]
  });

  const text = response.text;
  return JSON.parse(text);
};
```

---

## 📲 3. Simulador de Feed de Instagram y Difusión (`InstagramFeedModal.tsx`)

Ubicación del Componente: `src/components/InstagramFeedModal.tsx` y `src/components/SocialShareModal.tsx`

Para visualizar cómo lucirán los anuncios de la distribuidora antes de ser publicados oficialmente:

- **Simulador de Post de Instagram:** Renderiza una maqueta interactiva en tiempo real con la carátula de la película, laureles de selección del festival, ubicación geográfica del evento y pie de foto formateado con hashtags relevantes (`#SelecciónOficial`, `#CineIndependiente`, `#FestisCardigan`).
- **Generación de Hashtags Automáticos:** Sugiere hashtags personalizados según el país sede del festival, la categoría de la película (Ficción, Documental, Animación) y el tipo de premio obtenido.

---

## 📁 4. Integración de Prensa y Google Drive (`GoogleDrivePressKit`)

Ubicación del Módulo: `src/components/Modules/`

La difusión de una obra seleccionada requiere poner a disposición de los programadores del festival el kit de prensa (*Press Kit*). El sistema integra enlaces estructurados a Google Drive para verificar la disponibilidad de:

1. **Máster de Exhibición:** Copias ProRes 422 HQ / DCP con subtítulos incrustados.
2. **Stills y Fotografías en Alta Resolución:** Imágenes de la película a 300 DPI en formato JPG/PNG.
3. **Fotografía y Biografía del Director:** Retrato oficial e historial cinematográfico.
4. **Tráiler Oficial:** Archivo MP4 HD / 4K H.264 o enlace no listado de YouTube/Vimeo con contraseña.

---

## ⚙️ 5. Gestión de API Keys y Seguridad

- **Manejo Servidor / Cliente:** Para prevenir la exposición pública de tokens en el navegador, las solicitudes de Gemini se gestionan mediante rutas proxy de servidor o variables de entorno seguras (`GEMINI_API_KEY`).
- **Modelos Respaldo (Groq / HuggingFace):** Si la API de Gemini alcanza su límite de cuota (*rate limit*), el sistema conmuta a modelos alternativos de visión y texto configurados mediante `GROQ_API_KEY` y `HF_TOKEN`.
