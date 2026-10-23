# Especificación Técnica: Sprint de Calidad, Estabilización y Optimización de Portapapeles

**Mesa de Ingeniería de Software (Cuarteto Técnico) · Festis**  
**Fecha:** 14 de Octubre de 2026  
**Supervisión:** Director Axel  

---

## 1. OBJETIVOS Y ALCANCE

1. **Feedback Explícito ante Textos Negativos / Basura:**
   - Erradicación de cierres silenciosos sin retroalimentación al usuario.
   - Si el texto pegado arroja 0 convocatorias legítimas o no supera el firewall de relevancia cinematográfica, `ProcessingExtractionModal` se cierra y se emite de inmediato un toast de advertencia claro:
     `"No se identificaron convocatorias válidas en el texto copiado"`.
   - El helper `showToast` en `App.tsx` quedó desacoplado de flags de depuración interna para garantizar que todo usuario en producción reciba notificaciones visuales oportunas.

2. **Detección y Tratamiento de Convocatorias Vencidas (`BatchClipboardDetectionModal.tsx`):**
   - Análisis de fechas de cierre mediante `isCandidateExpiredOrClosed`:
     - Fecha límite anterior al día de hoy (`deadline < todayStr`).
     - Marcas de festival cerrado o descartado (`isClosedOrDiscarded === true`).
     - Términos de cierre detectados en observaciones o nombre (`isDiscardedOrClosed`).
   - **Badge Visual:** Insignia visible `[Convocatoria Vencida]` con estilo `bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full`.
   - **Preselección Defensiva:** Los festivales vencidos o cerrados se inicializan en `selectedForImport: false` (desmarcados) para prevenir cargas accidentales al lote activo de festivales del proyecto.

3. **Edición del Enlace (Link) en Modo Inline:**
   - Al activar el modo inline (mediante doble tap en la tarjeta o botón de edición), se incorporó un campo editable de ancho completo para la URL de postulación (`item.link`).
   - Soporte para protocolos `https://` y persistencia directa en el objeto festival al confirmar el lote.

4. **Sistema de Caché en Memoria Anti-Consumo de Cuota (`src/utils/clipboardFestivalParser.ts`):**
   - Estructura `InMemoryClipboardCache` con límite FIFO/LRU de 50 entradas y TTL de 15 minutos (`15 * 60 * 1000 ms`).
   - Clave normalizada que ignora diferencias de espacios en blanco múltiples y mayúsculas/minúsculas.
   - Respuestas en 0 ms sin consumo de cuota de API de IA ni llamadas HTTP ante consultas repetidas del mismo texto.

5. **Resolución de Errores de Consola y Estabilidad:**
   - **`server.ts`:** Actualización del modelo Gemini a `gemini-3.8-flash` para eliminar el error 404 del modelo obsoleto `gemini-2.5-flash`.
   - **`vite.config.ts`:** Configuración de `server.hmr: { clientPort: 443 }` para estabilizar el socket en proxies inversos HTTPS en Cloud Run (`run.app`).
   - **`src/App.tsx`:** Uso de referencias mutables (`currentProjectRef`, `festivalsRef`) para los listeners de eventos de ventana, permitiendo montar el `useEffect` una sola vez y eliminando el bucle de re-renderizado de la aplicación.
