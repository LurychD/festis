# Ciclo de Vida de Festivales, Estado "Cerrado" y Herramientas de Testeo

Este documento describe el flujo completo de gestión del ciclo de vida de los festivales en **Festis Cardigan**, incluyendo la transición automática a estado `Cerrado`, la apertura de nuevas ediciones vinculadas y el suite de pruebas en Debug Mode.

---

## 🔒 1. Estado "Cerrado" y Control de Convocatorias

### Desactivación del Cierre Automático No Supervisado
Para evitar modificaciones destructivas accidentales o pérdidas de sincronización entre el estado local y Firestore:
- **La rutina de cierre automático en segundo plano fue desactivada.** Las convocatorias que superan su fecha límite no se pasan de forma forzada o silenciosa al estado `Cerrado`.
- El usuario mantiene el control absoluto sobre las transiciones de estado de cada festival.
- Si un festival ya cerró formalmente su convocatoria, el equipo de distribución puede cambiar su estado de manera explícita o utilizar el asistente en el Dashboard.

### Asistente de Reversión de Cierres Previos
Para festivales que hayan sido marcados como `Cerrado` por la rutina previa del sistema:
- Se identifica cualquier entrada en `statusHistory` firmada por `"Sistema (Cierre Automático)"`.
- El banner de asistencia en el Dashboard permite **"Revertir al estado previo"** en un solo clic, restaurando el festival a su estado original (`previousStatus`, como "Por enviar" o "En duda") y dejando un registro de auditoría claro.

### 🎨 Estilo y Legibilidad de Tarjetas en Estado "Cerrado"
- **Relleno y Borde:** Relleno gris claro pulido con borde gris oscuro elegante (`bg-slate-100 text-slate-800 border-slate-500 shadow-sm`).
- **Adaptabilidad de Tipografía:** Mantiene la paleta tipográfica original de la app con alto contraste y legibilidad WCAG AA:
  - Número de índice (`#1`): Adaptado a `text-slate-400`.
  - Etiqueta de ID y metadatos (País, Tipo, Categoría, Fee): Adaptados a `text-slate-600` y bordes sutiles (`border-slate-300 bg-slate-200/60`).
  - Badge de estado: Píldora gris en contraste suave (`bg-slate-200 text-slate-800 border-slate-400`).
  - Cierre vencido: Etiqueta en tono gris neutro `bg-slate-200/80 text-slate-700 border-slate-300`.

---

## 🔄 2. Flujo de Apertura de "Nueva Edición"

Cuando un festival ha cerrado o completado su ciclo en un año determinado (estado `Cerrado`, `Ganado`, `No Seleccionado`, `Descalificado`, `Proyectado` o `En duda`), los usuarios autorizados pueden abrir una **Nueva Edición** manteniendo la trazabilidad histórica de postulaciones anteriores.

> ⚠️ **Restricción de Negocio:** Los festivales que se encuentran en estado **"Por enviar"**, **"En revisión"** o **"Seleccionado"** no muestran la opción de *"Nueva edición"*, ya que la convocatoria de la edición actual se encuentra abierta, en proceso de evaluación o en exhibición.

### UI/UX en 2 Fases con Confirmación Obligatoria:

1. **Fase 1: Modal de Confirmación Previa (`FestivalDetailsView.tsx`)**
   - Se activa al pulsar el botón **"Nueva edición"** en la vista de detalles.
   - Presenta la aclaración legal/operativa:
     > *"Vas a abrir una nueva edición de [Festival]. Podrás actualizar las fechas de convocatoria, categorías, requerimientos y plataforma manteniendo intacto el registro histórico de esta edición previa."*
   - Incluye una casilla de verificación obligatoria:
     - `[ ] Entiendo y deseo continuar a la apertura de la nueva edición.`
   - El botón **"Continuar"** permanece deshabilitado hasta que la casilla esté marcada.

2. **Fase 2: Formulario de Creación de Nueva Edición (`FestivalModal.tsx`)**
   - Muestra el título **"Nueva Edición"** y el subtítulo *"Apertura de nueva edición basada en: [Festival previo]"*.
   - Precarga los metadatos técnicos (País, Plataforma, Fee predeterminado, Categorías, Enlace Web, Laureles).
   - Limpia las fechas anteriores (`deadline`, `newsDate`) para solicitar el nuevo calendario de convocatoria.
   - Exige marcar una segunda casilla de verificación en el formulario:
     - `[ ] Voy a abrir una nueva edición de [Festival] y soy consciente de que esta acción no se puede deshacer.`
   - El botón **"Abrir Nueva Edición 🚀"** requiere la casilla marcada para habilitarse.

### Registro en Base de Datos y Módulo de Navegación:
- Se genera un nuevo registro de festival con ID único.
- Se establece `previousEditionId` apuntando al ID de la edición anterior.
- Se actualiza la trazabilidad bidireccional entre la edición previa y la nueva.
- **Sección "Ediciones Vinculadas del Festival" (`FestivalDetailsView.tsx`)**:
  - En la ficha de detalles de cualquier festival, se despliega una línea de tiempo (Timeline) interactiva con la insignia de la edición previa y un bloque completo de "Ediciones vinculadas del festival (Línea de tiempo)".
  - Organiza visualmente todas las ediciones asociadas (Anteriores Directas, Nuevas Siguientes u Homólogas Históricas) con conector vertical, nodos destacados e indicadores de estado, permitiendo navegar entre fichas con un clic y desplazamiento fluido al inicio con una transición sutil y limpia de fundido (`<AnimatePresence mode="wait">` con `initial={{ opacity: 0 }}`).
- **Drawer Lateral de la Wiki de Documentación (`DocsWikiView.tsx`)**:
  - El índice lateral de documentos se despliega como un drawer animado desde el borde derecho con interpolación fluida de resorte (`motion.aside` con `initial={{ x: '100%' }}` a `x: 0`) y telón de fondo oscuro translúcido (`motion.div` backdrop), eliminando destellos o parpadeos.
- **Jerarquía y Contraste de Secciones (`FestivalDetailsView.tsx`)**:
  - Reordenamiento de bloques técnicos: **Checklist de seguimiento** ➔ **Observaciones técnicas** ➔ **Historial de estados (trazabilidad)** ➔ **Ediciones vinculadas (Línea de tiempo)**.
  - Encabezados de sección reestilizados con tono oscuro de alto contraste (`text-slate-900 font-black`) para garantizar máxima legibilidad en todas las pantallas.
- **Botón Destacado `LINK` (`FestivalDetailsView.tsx`)**:
  - Posicionado estratégicamente en la parte superior del cuerpo de detalles, inmediatamente arriba de la **Checklist de seguimiento**.
  - Diseñado con tipografía ultra gruesa (`font-black`), icono de enlace externo y contraste fucsia de alto impacto.
- **Informe "Resumen para Prompts de IA" (`PromptSummaryReportCard.tsx` / `ReportsView.tsx`)**:
  - Generador de reportes en texto plano, Markdown (`.md`) y PDF (`.pdf`) estructurados para consumo por LLMs (ChatGPT, Gemini, Claude).
  - Incluye filtros por rango de tiempo (Hoy, Semanal [por defecto], Mensual, 60 días, 90 días, Todos, Rango Personalizado con fechas), selección de estados, plantillas de prompt (Estrategia, Resumen Ejecutivo, Tareas Pendientes, Texto Puro), interruptores de contenido (Observaciones, Checklist, Links, Ediciones, Historial) y un **contador en tiempo real de tokens con alerta de longitud alta** y botón **⚡ Auto-Compactar**.

---

## 🛠️ 3. Herramientas de Testeo (Debug Mode)

Las herramientas de testeo para este sistema están **estrictamente protegidas y solo son visibles/ejecutables cuando el `Debug Mode` se encuentra activo en Configuración**:

1. **Herramientas en Configuración (`ConfigView.tsx`)**:
   - **Simular Vencimiento de Convocatoria (`btn-test-sim-close`)**: Cambia la fecha límite de un festival en `Por enviar` a ayer (`YYYY-MM-DD`).
   - **Generar Nueva Edición de Prueba (`btn-test-sim-new-edition`)**: Crea al instante un nuevo festival vinculado por `previousEditionId`.

2. **Herramientas en Ficha de Festival (`FestivalDetailsView.tsx`)**:
   - Se muestra un banner distintivo de **Debug Mode** en la vista técnica de cualquier festival.
   - Permite atrasar la fecha a ayer, forzar transición a *Cerrado*, *Seleccionado* o *Ganado* para verificar en tiempo real el comportamiento de la interfaz y botones contextuales.

---

## 🧪 4. Detector de Festivales de Prueba y Badge Interactivo (Sin Necesidad de Debug Mode)

Para facilitar la verificación rápida de funciones de la aplicación en entornos de desarrollo sin requerir encender el `Debug Mode`:

1. **Badge Interactivo y Detector en Formulario de Creación (`FestivalModal.tsx`)**:
   - Al escribir la palabra `"test"` como desarrollador en el campo del nombre, aparece dinámicamente el badge `🧪 Test Badge (Crear Festi)` justo arriba del input.
   - Presionar el badge o intentar guardar el formulario activa el modal de confirmación con un temporizador regresivo de 3 segundos para evitar clics accidentales.
2. **Generación de Festival de Prueba Interactivo (`isTestFestival: true`)**:
   - Se crea automáticamente un festival de prueba limpio (sin tareas preconfiguradas por defecto, `tasks: []`) y equipado con un laurel vectorial que renderiza `"Test Festival 2026"`.
   - Incluye el control de contabilización en estadísticas (`includeInStats: false` por defecto para no alterar métricas reales, togglable al instante).
   - Equipado con la botonera de **Herramientas de Testeo Interactivo** en `FestivalDetailsView.tsx`:
     - Cambios rápidos a cualquier estado del sistema (*Por Enviar, Enviado, Inscripto, En Revisión, Seleccionado, Ganado, No Seleccionado, Cerrado*).
     - Modificación instantánea de plazos (*Cierre HOY, Cierre AYER para auto-cierre, Cierre +3 Días, Noticia +7 Días*).
     - Aplicación de Laureles Vectoriales "Test Festival 2026" (*Fondo Blanco, Fondo Negro, Sin Laurel*).
     - Conmutador directo de inclusión/exclusión en Estadísticas/Métricas (`includeInStats`).
     - Simulación de Proyección en Mapa (Cine Gaumont), adición de notas de observabilidad y reseteo completo.
   - En la cabecera se muestran los badges discretos `MODO TEST` y `📊 Excluido de Stats` / `📊 Incluido en Stats`.
