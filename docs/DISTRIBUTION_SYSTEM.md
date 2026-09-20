# Sistema de Planes de Distribución - Cortometraje "Cardigan"

Este módulo gestiona y realiza el seguimiento integral de planes y estrategias de distribución ante escuelas y organismos reguladores (como ENERC e INCAA), vinculando festivales individuales a planes estructurados de distribución.

## 1. Modelo de Datos y Entidades

Las entidades se encuentran definidas en `/src/types.ts`:

### DistributionInstitution
Representa los organismos e instituciones reguladoras o académicas que otorgan subsidios o avales.
* `id`: Identificador único (string).
* `nombre`: Nombre de la institución.
* `emailContacto`: Correo electrónico del área o persona responsable.
* `responsable`: Persona o área responsable.
* `notas`: Observaciones opcionales.
* `fechaCreacion`: Timestamp ISO.

### DistributionPlanStatus
Estados unificados del ciclo de vida del plan:
* `'borrador'`: Plan en elaboración interna.
* `'en_revision'`: Solicitud presentada y bajo evaluación del organismo evaluador.
* `'aprobado'`: Plan aprobado formalmente por la institución (desencadena el pase a catálogo oficial).
* `'no_aprobado'`: Solicitud rechazada o no financiada.
* `'archivado'`: Plan concluido o cerrado.

### DistributionPlan
Entidad central que agrupa la postulación institucional:
* `id`: Identificador único.
* `nombre`: Título del plan de fomento.
* `institucionId` / `institucionNombre`: Referencia a la institución asociada.
* `estado`: Estado institucional actual (`DistributionPlanStatus`).
* `statusHistory`: Historial inmutable de trazabilidad.
* `festivalesIds`: Lista de identificadores de festivales preexistentes vinculados.
* `festivalesBorrador`: Lista de festivales borrador formulados exclusivamente dentro del plan, aislados del catálogo general de la app hasta su aprobación.
* `notas`: Requisitos, bases y antecedentes del expediente.
* `fechaCreacion`: Fecha de creación en formato ISO.
* `fechaResolucion`: Plazo límite de resolución oficial (activa la cuenta regresiva).
* `presupuestoEstimado`: Presupuesto solicitado o asignado en pesos (ARS).

### Festival (Campos Institucionales Añadidos)
* `esBorradorPlan`: Booleano que indica si el festival es un borrador interno del plan.
* `distributionPlanId` / `distributionPlanName`: Vinculación al plan correspondiente.
* `institucionNombre`: Nombre del organismo que aprobó o evaluó el festival.
* `fechaAprobacionInstitucional`: Timestamp ISO exacto en el que se confirmó la aprobación.

---

## 2. Arquitectura de Interfaces y Flujos de Usuario

### 1. Listado Principal (DistributionPlansView)
* **Ubicación**: Accesible desde la barra inferior de navegación mediante el icono de brújula magnética (`HandDrawnCompass`).
* **Título Superior**: Título "Planes de Distribución" posicionado arriba del todo, sin subtítulo.
* **Layout de Tarjeta Horizontal Robusto con Paleta Pastel**: Cada plan se renderiza con un fondo y borde en tonalidad pastel según su estado institucional:
  - `borrador`: Slate suave (`bg-slate-50/80 border-slate-200/90`).
  - `en_revision`: Ámbar tenue (`bg-amber-50/70 border-amber-200/90`).
  - `aprobado`: Esmeralda suave (`bg-emerald-50/70 border-emerald-200/90`).
  - `no_aprobado`: Rosa suave (`bg-rose-50/70 border-rose-200/90`).
  - `archivado`: Púrpura suave (`bg-purple-50/70 border-purple-200/90`).
* **Centralización de Seguridad**: Se retiró el botón de borrado rápido del listado para prevenir eliminaciones accidentales en lote. La eliminación se gestiona exclusivamente desde la vista de detalle con verificación de doble paso.

### 2. Vista Detalle de Pantalla Completa (DistributionPlanDetailView)
Estructurada en tiras horizontales de diseño amplio:

* **Cabecera Superior**:
  - Botón de retorno al listado.
  - Badge de estado con codificación cromática oficial.
  - Botones de acción tipo icono SVG: **Editar Plan** (modal interactivo para modificar nombre, presupuesto, fecha y notas) y **Borrar Plan** (confirmación con auditoría).

* **Tira 1 - Información del Plan**:
  - Organismo / Escuela responsable.
  - Presupuesto solicitado.
  - Plazos temporales con botón para desplegar `CountdownModal` (reloj regresivo en vivo de días, horas, minutos y segundos).
  - Bloque completo de notas, requisitos y bases sin truncamiento de texto.

* **Tira 2 - Trazabilidad Institucional**:
  - Botón **Actualizar Estado Institucional**: Abre el modal de transición de estado.
  - **Validación Estricta de Selección**: El botón de confirmación permanece inhabilitado (`disabled`) si no se ha seleccionado un estado o si el estado seleccionado es exactamente idéntico al actual, evitando transiciones redundantes o vacías.
  - **Temporizador de seguridad de 3 segundos**: Al seleccionar un estado válido distinto al actual, se activa la cuenta regresiva visual antes de permitir la confirmación.
  - Historial cronológico inmutable con autor, estado anterior, estado nuevo, timestamp y justificación oficial.

* **Tira 3 - Gestión Dual de Festivales del Plan**:
  - **Botón A: "Vincular festivales preexistentes"**: Selector modal que filtra exclusivamente festivales de la app en estados `"Por enviar"`, `"En revisión"`, `"En duda"`, `"Próximamente"` o `"Archivados"`.
  - **Botón B: "Añadir festival del plan"**: Formulario modal completo para registrar festivales borrador que permanecen confinados al plan sin impactar en la lista oficial de la app.
  - **Tarjetas de Festivales en Colores Pasteles**: Las tarjetas de festivales (borrador y preexistentes) aplican la paleta pastel armónica según su estado (`bg-amber-50` para borradores, `bg-emerald-50` para seleccionados/ganados, `bg-sky-50` para revisión/enviados/inscriptos, `bg-teal-50` para confirmados, `bg-rose-50` para no seleccionados).
  - **Badges de Procedencia**: Indicadores visuales claros entre `"Existente en app"` y `"Borrador de plan"`.

* **Tira 4 - Exportación Dual a PDF (`exportDistributionPlanPDF`)**:
  - Ubicada al pie de la vista de detalle. Al hacer clic en "Exportar Plan en PDF", despliega un modal selector de reporte.
  - **Cálculo de Proporción del Logo**: Obtiene `naturalWidth` y `naturalHeight` de la imagen del corto para renderizarla respetando matemáticamente su aspect ratio, erradicando cualquier deformación horizontal.
  - **Selector de Destinatario**:
    1. **Reporte Oficial (Institución Reguladora)**:
       - Diseñado formalmente para presentación ante el organismo evaluador.
       - Banner simplificado: Organismo Regulador, Presupuesto, Fecha de Emisión, Emitido Por y Cantidad Total de Festivales Postulados (número entero sin discriminar borradores ni catálogo).
       - Nómina oficial: Columnas `#`, `Nombre festival`, `País` (ancho completo sin cortes), `Cierre` en formato estricto `DD/MM/AA`, `Costo`, `Link de inscripción` y `Observaciones`.
       - Oculta etiquetas de borrador y estados de postulación internos.
    2. **Minuta de Trabajo (Uso Interno)**:
       - Diseñado para seguimiento y control del equipo de producción.
       - Banner con desglose de borradores vs. catálogo oficial.
       - Nómina con badges de procedencia `[BORRADOR DE PLAN]` / `[CATÁLOGO OFICIAL]` y columna de estado de postulación (`FestivalStatus`).
  - Opciones de configuración: Selección de tamaño de hoja (A4 / Oficio Legal), orientación (Vertical / Horizontal) y casilla para incluir bases y notas de la convocatoria.

---

## 3. Flujo Crítico de Aprobación Institucional

Cuando un usuario autorizado selecciona el estado **"Aprobado"**, el sistema intercepta la acción y despliega un modal de confirmación crítica de pase a catálogo oficial:

1. **Resumen de la Solicitud**: Nombre del plan, organismo evaluador y presupuesto.
2. **Desglose Exhaustivo**:
   - Festivales borrador que serán dados de alta formalmente en la app.
   - Festivales preexistentes que actualizarán su metadata institucional.
3. **Advertencia de Irreversibilidad**: Cartel de advertencia informando que la acción no puede deshacerse.
4. **Casilla de Verificación Obligatoria**: *"Entiendo y soy consciente de que esta acción no se puede deshacer"*.
5. **Cuenta Regresiva de 5 Segundos**: Una vez tildada la casilla, se activa un temporizador de 5 segundos en el botón de confirmación antes de habilitarlo.
6. **Ejecución Atómica**:
   - Los festivales borrador pasan a la colección `festivals` de la app con `esBorradorPlan: false` y timestamp `fechaAprobacionInstitucional`.
   - Los festivales preexistentes reciben la estampa de aprobación y el nombre de la institución.
   - El plan pasa a estado `'aprobado'` y sus IDs quedan consolidados en `festivalesIds`.
   - Se registra el log de auditoría correspondiente en Firestore.

---

## 4. Visualización en FestivalDetailsView

* **Festivales Borrador**: Si se visualiza un festival borrador desde el plan, se presenta un banner prominente en color ámbar informando a qué plan pertenece y advirtiendo que aún no ha sido aprobado institucionalmente.
* **Festivales Aprobados**: Al ingresar a cualquier festival formalmente aprobado por un plan de fomento, se muestra un banner verde esmeralda con el icono `ShieldCheck`, el nombre del plan, la institución reguladora y la marca temporal exacta de aprobación.

---

## 5. Resiliencia, Blindaje y Sincronización de Festivales Borrador

* **Resolución Desacoplada de Festival**: Al navegar a la vista de detalle de un festival, `App.tsx` busca primero en la colección central `festivals` y, en caso de no hallarlo (como ocurre con festivales borrador confinados a un plan de distribución antes de su aprobación), recurre a `selectedFestival` sin arrojar excepciones de desreferenciación.
* **Cláusula de Guardia Defensiva en `FestivalDetailsView`**: Si por cualquier motivo el objeto festival recibido es nulo o indefinido, el componente no intenta acceder a propiedades como `id` o `name` en sus hooks reactivos (`useMemo`). En su lugar, despliega una interfaz de contingencia limpia con botón de retorno seguro al plan o listado anterior.
* **Sincronización Bidireccional de Estados y Tareas**: Las operaciones de actualización de estado (`handleUpdateStatus`), adición/edición/borrado de tareas (`syncDraftFestivalTasks`) y eliminación de festival contemplan explícitamente si el festival es un borrador (`esBorradorPlan: true`), sincronizando automáticamente los cambios en el array `festivalesBorrador` del plan correspondiente y retornando a la vista `distribution_plan_detail`.

