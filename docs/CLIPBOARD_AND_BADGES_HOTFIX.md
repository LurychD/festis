# ESPECIFICACIÓN TÉCNICA: FLUJOS DE PORTAPAPELES, HOLD-TO-CONFIRM Y BADGE "NUEVO"

Este documento detalla la arquitectura de integración, ergonomía táctil y lógica reactiva implementada en el hotfix de portapapeles, confirmación por pulsación prolongada (Hold-to-Confirm) y distintivos temporales para convocatorias cinematográficas.

---

## 1. Desacople y Orquestación del Portapapeles

### Flujo Unificado Global
El listener global de pegado (`window.addEventListener('paste')`), atajos de teclado (Ctrl+V / Cmd+V) y el disparador de la barra de herramientas de festivales (`festis:trigger-clipboard-capture`) quedan estrictamente alineados:
1. **Extracción y Diagnóstico:** Se abre `ProcessingExtractionModal`, el cual muestra los 5 pasos progresivos de normalización, extracción de entidades con Regex/Chrono/Compromise, consulta al catálogo canónico y deduplicación de 5 capas.
2. **Revisión Obligatoria en Lote (1 o N festivales):** Al finalizar el procesamiento, se abre `BatchClipboardDetectionModal`. Queda estrictamente prohibido puentear la confirmación cuando se detecta un solo festival; el usuario debe revisar la tarjeta, pudiendo editar campos inline o descartar.
3. **Aislamiento de FestivalModal:** El formulario modal individual (`FestivalModal.tsx`) no responde a eventos globales de teclado ni de pegado arbitrario; únicamente se autocompleta cuando el usuario pulsa de forma explícita el botón icon-only situado en el pie del propio formulario.

---

## 2. Doble-Tap para Edición Inline (`BatchClipboardDetectionModal`)

Para agilizar la revisión táctil sobre dispositivos móviles sin recurrir a modales anidados pesados:
- **Tap Simple:** Selecciona o deselecciona el festival para su inclusión en el lote de importación.
- **Doble Tap (`delta < 320ms`):** Detectado mediante la referencia temporal `lastTapRef.current[index]`. Conmuta la tarjeta al modo de edición rápida inline, permitiendo ajustar:
  * Nombre de la convocatoria.
  * País de origen.
  * Fecha límite de inscripción (`deadline`).
  * Arancel / Fee de postulación (`price`).
- **Títulos Extensos:** Se utiliza `overflow-x-auto scrollbar-none touch-pan-x whitespace-nowrap` para habilitar el desplazamiento horizontal fluido con el pulgar sin distorsionar el layout de la tarjeta.

---

## 3. Botón "Importar" con Hold-to-Confirm de 3 Segundos

Para prevenir escrituras accidentales y asegurar una confirmación táctil deliberada:
- **Eventos:** Se capturan de forma agnóstica `onMouseDown` y `onTouchStart` para inicializar el contador, y `onMouseUp`, `onMouseLeave`, `onTouchEnd` y `onTouchCancel` para abortar la operación.
- **Temporizador:** Incrementa el estado `holdProgress` de 0% a 100% a lo largo de 3000 ms continuos.
- **Transición de Color:** El botón inicia en el color corporativo magenta (`#e91e63`) y, a medida que la barra interior se completa, muta a esmeralda (`#059669`).
- **Persistencia:** Solo al alcanzarse el 100% (3.000 ms) se invoca la mutación a Firestore (`onConfirm`), seguida del cierre del modal y notificación toast.
- **Gramática Dinámica:** "Importar 1 Festival (Mantener 3s)" vs "Importar N Festivales (Mantener 3s)".

---

## 4. Insignia Visual "Nuevo" (`isNewFestival`)

- **Helper:** `src/utils/dateUtils.ts` exporta `isNewFestival(createdAt?: string): boolean`.
- **Condición:** Evalúa si `Date.now() - created < 24 * 60 * 60 * 1000`.
- **Estilo:** `bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] / text-[10px] font-bold px-2 py-0.5 rounded-full`.
- **Ubicaciones Validadas:**
  * Tarjetas de catálogo en `FestivalListView.tsx`.
  * Cabecera de detalle en `FestivalDetailsView.tsx` (**exclusivamente junto al título principal `h1`**, eliminando duplicados en barras de metadatos).
  * Tarjetas del Dashboard:
    - `UpcomingDeadlinesList.tsx` (Próximos cierres).
    - `PinnedFestivalsList.tsx` (Festivales pineados).
    - `AutoClosedFestivalsList.tsx` (Cerrados recientemente).
    - `TodaysAgendaList.tsx` (Agenda diaria de festivales).
