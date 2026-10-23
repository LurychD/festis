# HOTFIX QUIRÚRGICO: UNIFICACIÓN DE FLUJOS DE PORTAPAPELES, HOLD-TO-CONFIRM, BADGES Y BLINDAJE CARDIGAN

**Mesa de Ingeniería de Software (Cuarteto Técnico) · Festis**  
**Fecha:** 14 de Octubre de 2026  
**Supervisión:** Director Axel  

---

## 1. RESUMEN EJECUTIVO Y OBJETIVOS ALCANZADOS

1. **Desacople y Unificación del Listener Global de Portapapeles (`App.tsx`):**
   - Eliminación definitiva de cualquier puente legacy que ante un evento `paste` abriera directamente el formulario `FestivalModal.tsx`.
   - El listener global de paste, el botón de la toolbar y el submodal de contingencia invocan obligatoriamente la secuencia canónica:
     1. `ProcessingExtractionModal` (modal de carga con los 5 pasos progresivos).
     2. `BatchClipboardDetectionModal` (modal universal de revisión y confirmación de lotes).
   - Prohibido puentear la confirmación: ante 1 festival detectado, `BatchClipboardDetectionModal` se abre igualmente mostrando esa única tarjeta, permitiendo edición rápida por doble tap y requiriendo confirmación con botón presionado durante 3 segundos ("Importar 1 festival"). Ante $N$ festivales, expone el lote completo con selección individual.

2. **Unificación del Gateway de Captura en `FestivalModal.tsx`:**
   - Erradicación de la lógica que consumía `detectFestivalFromText` para hidratar únicamente el primer festival desechando el resto del lote.
   - El botón icon-only de portapapeles y el submodal de pegado manual dentro de `FestivalModal.tsx` ahora cierran limpiamente el formulario (`onClose()`) y delegan el texto capturado al pipeline universal mediante el evento desacoplado `festis:process-clipboard-text`.

3. **Blindaje contra Alucinaciones y Filtrado de Relevancia:**
   - **Cliente (`src/utils/clipboardFestivalParser.ts`):** Validación estricta en `hasFestivalRelevance(text)` previo a cualquier llamado al backend o segmentación de texto. Detección y descarte inmediato ante código fuente (`import`, `export`, `interface`, `type`, JSX/HTML, `className`, hooks de React), nombres de componentes (`FestivalModal`, `FestivalListView`, etc.), logs de error (`error TS`, `stack trace`) y reportes de QA (`Vitest`, `REPORTE DE AUDITORÍA`). Si no supera el umbral de relevancia cinematográfica, retorna array vacío de inmediato sin alucinaciones.
   - **Servidor (`server.ts`):** Blindaje preventivo en el endpoint `/api/parse-festivals-batch` con filtro regex defensivo contra código o suites de prueba, y prompt endurecido con las Reglas de Oro de Cardigan: prohibición absoluta de interpretar código fuente o reportes como festivales, respondiendo estrictamente `{ "festivals": [] }` si no existen convocatorias reales con organizador, fecha o arancel verificable.

4. **Doble-Tap para Edición Inline (`BatchClipboardDetectionModal.tsx`):**
   - Restauración del mecanismo de Cardigan: un solo tap conmuta la selección/deselección de la tarjeta para importación; un DOBLE TAP (delta `< 320ms` mediante `lastTapRef`) activa el modo de edición rápida inline (Nombre, País, Deadline, Fee) directamente en la tarjeta.
   - En títulos largos no editados se incorporó desplazamiento horizontal fluido `overflow-x-auto scrollbar-none touch-pan-x` con cursor de lectura.

5. **Botón Hold-to-Confirm de 3 Segundos:**
   - En el pie de `BatchClipboardDetectionModal.tsx`, el botón de confirmación requiere mantener presionado durante 3 segundos continuos (`onMouseDown` / `onTouchStart` con cancelación en `onMouseUp` / `onMouseLeave` / `onTouchEnd`).
   - Llenado visual de fondo progresivo de 0% a 100% y transición cromática continua desde magenta (`#e91e63`) hasta verde esmeralda (`#059669`).
   - Persistencia segura en Firestore (`setFestivals`) y notificación toast con gramática dinámica al completar los 3 segundos.

6. **Badge "Nuevo" (< 24 horas):**
   - Helper determinista `isNewFestival(createdAt?: string): boolean` en `src/utils/dateUtils.ts`.
   - Integrado en tarjetas de `FestivalListView.tsx`.
   - Integrado en los 4 submódulos del Dashboard (`UpcomingDeadlinesList.tsx`, `PinnedFestivalsList.tsx`, `AutoClosedFestivalsList.tsx`, `TodaysAgendaList.tsx`).
   - **Corrección de Duplicado en `FestivalDetailsView.tsx`:** Eliminación del badge redundante en la fila superior de pills de estado. Se conserva una única ocurrencia ubicada exclusivamente junto al título principal `h1`.

7. **Actualización del RFC de Escritorio (`/docs/roadmap/DESKTOP_WORKSPACE_SPEC.md`):**
   - Erradicación completa de referencias a plazos escalonados comerciales (*Early*, *Regular*, *Late*) en la sección de Sub-panel Inferior (Modo Gantt) y en la Matriz de Componentes por Workspace Preset.
   - Consolidación del modelo de hitos basado exclusivamente en la entidad canónica `Festival`:
     * Hito de postulación: rombo/marcador puntual en `deadline` con rango de preparación previo.
     * Tramo de evaluación del jurado: barra continua entre `deadline` y `newsDate`.
     * Hito de exhibición o estreno: marcador puntual en `projectionDate`.
     * Resiliencia ante datos parciales: si solo cuenta con `deadline`, dibuja ese hito puntual sin fallar ni alterar el modelo de datos en Firestore.

8. **Feedback Explícito ante Textos Negativos / Basura:**
   - Cierre limpio de `ProcessingExtractionModal` y emisión de toast informativo ante 0 convocatorias: "No se identificaron convocatorias válidas en el texto copiado".

9. **Detección y Tratamiento de Convocatorias Vencidas (`BatchClipboardDetectionModal.tsx`):**
   - Detección determinista vía `isCandidateExpiredOrClosed` (deadline anterior a hoy o términos de descarte).
   - Insignia visible `[Convocatoria Vencida]` en paleta rose (`bg-rose-50 text-rose-700 border-rose-200`).
   - Desmarcado preventivo automático (`selectedForImport: false`) para evitar cargas accidentales.

10. **Edición del Enlace (Link) en Modo Inline:**
    - Incorporación de campo editable para URL de postulación (`link`) en la cuadrícula de edición inline por doble-tap junto a Nombre, País, Deadline y Fee.

11. **Sistema de Caché Persistente de 24 Horas en Cliente (`festis_clipboard_cache_v1`):**
    - Caché local en `localStorage` y memoria con TTL de 24 horas (86.400.000 ms), límite FIFO/LRU de 50 entradas.
    - Respuestas inmediatas (0 ms, cero consumo de cuota o llamadas al LLM) ante textos procesados en la misma jornada.

12. **Detección en Vivo de Similitud contra Pool Dual:**
    - Deduplicación de 5 capas cotejando contra:
      a) Obra Activa de Firestore: alerta "Ya en seguimiento: Coincide con festival existente ([Nombre])".
      b) Caché de copys del día: alerta "¿Es la misma convocatoria? Coincide con un texto analizado anteriormente hoy ([Nombre])".
    - Desmarcado automático preventivo ante duplicados identificados.

13. **Blindaje de Entorno y Servidor:**
    - `server.ts`: Modelo configurado a `gemini-3.8-flash` y Groq `llama-3.3-70b-versatile` con abort controller de 2000ms.
    - `vite.config.ts`: HMR con `clientPort: 443` para estabilidad en Cloud Run HTTPS.
    - `App.tsx`: `useCallback` en `subCollectionPath` y referencia mutable estable `processClipboardTextRef` para eliminar re-renders continuos.

---

## 2. INVENTARIO DE ARCHIVOS INTERVENIDOS

| Archivo | Naturaleza | Modificación Principal |
| :--- | :--- | :--- |
| `src/utils/dateUtils.ts` | Código | Función `isNewFestival` con tolerancia a fechas corruptas o nulas. |
| `src/utils/clipboardFestivalParser.ts` | Código | `hasFestivalRelevance` determinista, regla de co-ocurrencia cinematográfica, exclusión de deportes/música, caché persistente 24h y AbortController. |
| `src/utils/clipboardDeduplicator.ts` | Código | Motor de 5 capas con soporte de Pool Dual (`PROJECT_WORK` vs `DAILY_CACHE`). |
| `server.ts` | Backend | Reglas de Oro de Cardigan en prompt, filtro regex defensivo y modelo `gemini-3.8-flash`. |
| `vite.config.ts` | Config | `clientPort: 443` en HMR para suprimir caídas de WebSocket en proxy Cloud Run. |
| `src/components/FestivalModal.tsx` | UI | Delegación universal vía evento `festis:process-clipboard-text` y cierre del formulario. |
| `src/components/FestivalDetailsView.tsx` | UI | Desduplicación del badge "Nuevo" (único junto al título h1) y SVG `BarChart3`. |
| `src/components/FestivalListView.tsx` | UI | Badge "Nuevo" condicional en tarjetas de festivales. |
| `src/components/dashboard/*.tsx` | UI | Badge "Nuevo" en listas de cierre, fijados, auto-cerrados y agenda diaria. |
| `src/components/modals/BatchClipboardDetectionModal.tsx` | UI | Hold-to-Confirm de 3s (#e91e63 a #059669), doble-tap inline con URL, badge Convocatoria Vencida en rose y alertas de Pool Dual. |
| `src/App.tsx` | Arquitectura | Conexión del Pool Dual, estabilización de listeners con refs y useCallback, feedback explícito en toast. |
| `/docs/roadmap/DESKTOP_WORKSPACE_SPEC.md` | Documentación | Erradicación de Early/Regular/Late en Gantt y consolidación de hitos canónicos. |
| `/docs/TESTING_AND_DEPLOYMENT.md` | Documentación | Inventario de 8 suites y 67 pruebas de Vitest. |
| `src/test/clipboardQualitySprint.test.tsx` | Testing | 13 pruebas unitarias: caché 24h, FakeTimers, convocatorias vencidas, link inline, co-ocurrencia audiovisual y pool dual. |
| `src/test/clipboardAndBadgesHotfix.test.tsx` | Testing | 11 pruebas unitarias cubriendo fechas, doble tap, hold-to-confirm, no-duplicado y dashboard. |
| `src/test/FestivalClipboardFallback.test.tsx` | Testing | 5 pruebas de contingencia, delegación al gateway universal y cierre de modal. |

---

## 3. CONTROL DE CALIDAD Y RESULTADOS DE SUITE

- **TypeScript (`tsc --noEmit`):** 0 errores, 0 advertencias. Tipado estricto verificado.
- **Vite Build (`vite build`):** Compilación de producción impecable sin advertencias.
- **Vitest (`npx vitest run`):**
  - **Archivos de prueba:** 8/8 pasados (100%).
  - **Tests ejecutados:** 67 pasados, 0 fallados.
