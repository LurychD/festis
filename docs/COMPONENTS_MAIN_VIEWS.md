# Vistas Principales — Guía Detallada de Componentes

Este documento contiene la especificación técnica profunda, arquitectura de estado, props, eventos y análisis funcional explayado de las 15 Vistas Principales ubicadas en `src/components/`. Cada sección ha sido formateada minuciosamente sin el uso de viñetas.

---

## 🖥️ 1. FestivalListView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/FestivalListView.tsx`  
Categoría: Vista Principal / Catálogo Central  

Descripción y Arquitectura Explayada:
FestivalListView es el corazón operativo de la aplicación. Responsable de procesar, presentar y gestionar el volumen completo de postulaciones a festivales de cine. Soporta una experiencia de visualización dual que permite al usuario alternar entre una cuadrícula gráfica de tarjetas (Grid View), ideal para inspección visual de afiches y estados, y una tabla compacta de alta densidad (Table View), diseñada para administradores que requieren consultar múltiples registros en pantallas de trabajo.

El componente integra un motor de búsqueda fuzzy cliente que filtra los resultados en tiempo real sin requerir peticiones adicionales al servidor. Al encontrar coincidencias en el nombre del festival, categoría o país, resalta dinámicamente el fragmento de texto utilizando etiquetas `<mark>` integradas en el DOM. Además, ofrece selectores de filtrado por estado (Por enviar, En revisión, Seleccionado, Ganado, etc.) y plataforma (FilmFreeway, Shortfilmdepot, Movibeta, Festhome), aplicando un ordenamiento estrictamente estructurado donde las convocatorias en estado 'Cerrado' o vencidas son relegadas automáticamente a la parte inferior de la lista para mantener la atención en las postulaciones activas.

Especificación Técnica de Props:
```typescript
interface FestivalListViewProps {
  festivals: Festival[];
  searchTerm: string;
  selectedStatusFilter: string;
  selectedPlatformFilter: string;
  sortBy: "deadline" | "name" | "fee" | "status";
  sortOrder: "asc" | "desc";
  viewMode: "grid" | "table";
  onSelectFestival: (id: string) => void;
  onEditFestival: (festival: Festival) => void;
  onDeleteFestival: (id: string) => void;
  onTogglePin: (id: string) => void;
  onChangeStatus: (festival: Festival) => void;
}
```

Optimización de Rendimiento y Hooks:
Aplica memoización extensiva mediante el hook `useMemo` de React para calcular los conjuntos filtrados y ordenados. Esto evita el recalculo computacional costoso ante renderizados provocados por componentes adyacentes. Complementariamente, integra un mecanismo de retardo debounce sobre el término de búsqueda para garantizar fluidez a 60 FPS en dispositivos móviles.

---

## 📑 2. FestivalDetailsView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/FestivalDetailsView.tsx`  
Categoría: Ficha Técnica e Inspección  

Descripción y Arquitectura Explayada:
FestivalDetailsView proporciona un entorno de inspección exhaustivo centrado en una única postulación a festival. Desglosa de manera transparente toda la información asociada al registro, organizándola en secciones visuales claramente delimitadas.

En el panel principal, despliega una línea de tiempo (timeline) cronológica auditable que registra cada cambio de estado histórico (`statusHistory`), especificando la fecha exacta, el usuario que realizó la modificación y las notas aclaratorias del veredicto. Adicionalmente, incluye un módulo de gestión de costos específicos (`costs`), un gestor de tareas incrustado (`tasks`) y una **sección dedicada de Recordatorios Vinculados** (`reminders`) ubicada inmediatamente debajo de las observaciones técnicas, que permite crear, listar, editar y eliminar alertas/recordatorios agendados específicos para esta convocatoria (notificaciones de correos, seguimiento de comités, aviso de fechas clave).

Asimismo, incorpora un **Banner Unificado y Dinámico del Plan de Distribución** situado inmediatamente debajo del bloque principal de datos. Este banner consolida en una sola tarjeta de diseño sobrio el nombre del plan, el organismo regulador correspondiente, el ID alfanumérico del plan y el badge de estado operativo (Borrador, En Evaluación, Aprobado, etc.), eliminando carteles duplicados y unificando el acceso contextual al plan vinculado.

Especificación Técnica de Props:
```typescript
interface FestivalDetailsViewProps {
  festivalId: string;
  onBack: () => void;
  onEdit: (festival: Festival) => void;
  onChangeStatus: (festival: Festival) => void;
  onDelete: (id: string) => void;
}
```

Handlers Operativos:
El handler `handleAddTask` inserta nuevos requerimientos en la lista atómica de tareas del festival en Firestore. El handler `handleToggleTask` conmuta la propiedad de finalización. El handler `handleAddCost` registra un nuevo ítem en la contabilidad específica del festival.

---

## 📊 3. StatsView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/StatsView.tsx`  
Categoría: Analítica de Rendimiento  

Descripción y Arquitectura Explayada:
StatsView transforma los metadatos de las postulaciones en métricas cuantitativas e inteligencia de negocios. Su propósito es brindar al equipo de distribución una comprensión clara sobre la efectividad de sus estrategias de inscripción y la rentabilidad financiera del presupuesto asignado.

Integra la librería de visualización Recharts para renderizar gráficos interactivos en SVG. Despliega un gráfico de pastel (Pie Chart) para la distribución porcentual de postulaciones según su estado actual, un gráfico de barras (Bar Chart) para la inversión acumulada en fees discriminada por plataforma y líneas de tendencia temporal. Calcula automáticamente indicadores de alto nivel como la Tasa de Aceptación Global, el Promedio de Días de Respuesta de los Comités de Selección y el Costo Promedio por Selección Oficial Obtenida.

Módulos de Auditoría e Interfaz:
- **Resumen por Estado en Tarjetas Flexibles:** Tarjetas contenedoras adaptativas (`min-w-0 overflow-hidden`) que garantizan la contención visual de títulos y badges numéricos sin desbordamientos tipográficos en cualquier resolución.
- **Auditoría Detallada de Gastos (Modal ROI):** Incorpora un modal de desglose financiero (`showRoiModal`) activable desde la tarjeta de ROI que detalla cada festival con su costo en USD, estado, país y una **barra de progreso visual de porcentaje** que ilustra la participación de cada fee sobre el gasto total acumulado. Permite filtrar instantáneamente festivales gratuitos vs pagos y buscar por texto en tiempo real.

Especificación Técnica de Props:
```typescript
interface StatsViewProps {
  festivals: Festival[];
  isDarkMode?: boolean;
}
```

---

## 📅 4. CalendarView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/CalendarView.tsx`  
Categoría: Agenda y Calendario  

Descripción y Arquitectura Explayada:
CalendarView provee una interfaz de agenda reactiva mensual e iterativa adaptada a las necesidades temporales de la distribución cinematográfica. Mapea automáticamente los registros de la base de datos y coloca marcadores visuales distintivos para tres eventos clave por festival: la fecha límite de inscripción (deadline), la fecha límite de fallo o notificación de seleccionados (newsDate) y la fecha de proyección presencial en sala (projectionDate).

Permite navegar ágilmente entre meses pasados y futuros, ofreciendo filtros por estado y accesos directos que abren el modal de detalles al hacer clic sobre cualquier evento agendado.

---

## 🚀 5. DashboardView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/DashboardView.tsx`  
Categoría: Control Ejecutivo  

Descripción y Arquitectura Explayada:
DashboardView es la pantalla principal de bienvenida y la central de mando del sistema. Consolida en una sola vista panorámica los indicadores de rendimiento más urgentes del circuito. Incorpora tarjetas resumen de KPIs, el widget `PinnedFestivalsList` para festivales fijados con notas prioritarias, el listado `TodaysAgendaList` con las tareas que vencen en el día y el temporizador `UpcomingDeadlinesList` para evitar la pérdida de convocatorias inminentes.

---

## 📋 6. TasksView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/TasksView.tsx`  
Categoría: Gestor de Tareas Global  

Descripción y Arquitectura Explayada:
TasksView actúa como un centro unificado de control de tareas. Su función principal es extraer, normalizar y presentar el conjunto consolidado de todas las sub-tareas dispersas en las distintas postulaciones a festivales. Proporciona filtros por estado de cumplimiento (Pendientes vs. Completadas), ordenamiento por fecha límite y asignación de responsables, permitiendo marcar tareas como finalizadas sin tener que navegar individualmente a cada festival.

---

## 🎯 7. PlanningView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/PlanningView.tsx`  
Categoría: Planificación Kanban  

Descripción y Arquitectura Explayada:
PlanningView implementa un entorno visual de evaluación previa estructurado en columnas. Está diseñado para que los productores y distribuidores analicen las bases de convocatorias futuras antes de proceder a la postulación formal y al pago de inscripciones. Permite organizar festivales candidatos en etapas de investigación, pre-selección y presupuesto.

---

## 🎬 8. FilmDataView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/FilmDataView.tsx`  
Categoría: Ficha Técnica de la Película  

Descripción y Arquitectura Explayada:
FilmDataView almacena la información maestra de la obra audiovisual en distribución. Centraliza en un único punto seguro los títulos oficial e internacional, las sinopsis corta, mediana y larga en español e inglés, la ficha artística y técnica completa (dirección, guion, producción, dirección de fotografía, montaje, diseño de sonido), así como los enlaces privados de visionado (Vimeo/YouTube) acompañados de sus respectivas claves de acceso y códigos de acreditación.

---

## 📝 9. ProductionNotes.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/ProductionNotes.tsx`  
Categoría: Cuaderno de Bitácora  

Descripción y Arquitectura Explayada:
ProductionNotes ofrece un espacio de redacción flexible para llevar la bitácora del proyecto. Permite redactar anotaciones de reuniones con agentes de ventas, notas de prensa, recomendaciones brindadas por jurados y minutas de seguimiento de festivales.

---

## 📄 10. ReportsView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/ReportsView.tsx`  
Categoría: Exportación de Reportes  

Descripción y Arquitectura Explayada:
ReportsView es el módulo encargado de la generación de documentos oficiales y rendiciones de cuentas. Utiliza librerías de renderizado como `jspdf` y `html2canvas` para compilar dossiers ejecutivos en PDF con gráficos e historiales formateados para impresión o envío a fondos estatales de financiamiento cinematográfico, incluyendo además exportaciones completas en formatos CSV y Excel.

---

## 📦 11. ArchiveView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/ArchiveView.tsx`  
Categoría: Archivo Histórico  

Descripción y Arquitectura Explayada:
ArchiveView es una vista especializada que filtra y muestra las postulaciones concluidas o desestimadas que han sido marcadas con la propiedad `archived: true`. Asegura que la vista principal de trabajo se mantenga despejada de elementos pasados sin comprometer la integridad ni la trazabilidad histórica de los datos acumulados.

---

## 🖼️ 12. GalleryView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/GalleryView.tsx`  
Categoría: Galería Multimedia  

Descripción y Arquitectura Explayada:
GalleryView organiza y proyecta todos los recursos visuales vinculados a la película y sus festivales. Presenta una cuadrícula responsiva equipada con un visor de imágenes (Lightbox) para examinar afiches en alta resolución, laureles obtenidos con fondo transparente PNG y fotogramas oficiales en calidad de prensa.

---

## ⚙️ 13. ConfigView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/ConfigView.tsx`  
Categoría: Ajustes del Sistema  

Descripción y Arquitectura Explayada:
ConfigView administra las preferencias globales del usuario, miembros y plataforma divididas de forma modular en pestañas: **General** (autenticación Google, gestión del teléfono móvil para SMS, notificaciones Push, plataformas de envío y el módulo unificado de **Seguridad & Autenticación de Dos Pasos - 2FA** con recuperación por Email + SMS), **Servicios** (gestión de Gemini Spark, clave secreta API Key resguardada en Firestore `system_settings/gemini_spark` y `localStorage`, prompt de conexión), **Miembros** (roles y correos autorizados), **DB** (exportación/importación y réplicas), **Visuales** (shaders analógicos y grano), **INFO** (auditoría y métricas de lectura/escritura) y **DEV** (consola de desarrollo, herramientas de testing y simulación de errores). Además incluye acceso directo a la Wiki Técnica Interactiva in-app.

---

## ❓ 14. HelpView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/HelpView.tsx`  
Categoría: Centro de Ayuda  

Descripción y Arquitectura Explayada:
HelpView es el centro de conocimiento del sistema. Ofrece explicaciones detalladas sobre el funcionamiento de las plataformas de distribución, definiciones claras de cada uno de los estados de veredicto y un listado completo de los atajos de teclado globales disponibles para agilizar la navegación.

---

## 📚 15. DocsWikiView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/DocsWikiView.tsx`  
Categoría: Wiki Técnica e Interfaz Markdown  

Descripción y Arquitectura Explayada:
DocsWikiView es la interfaz gráfica interactiva encargada de renderizar la documentación interna del repositorio. Importa dinámicamente los archivos Markdown mediante `import.meta.glob`, proporcionando navegación por árbol de categorías desplegables, resaltado de sintaxis para bloques de código, interceptor de enlaces internos para navegación fluida y modal para inspeccionar el contenido en formato RAW.

---

## 🎨 16. ThemeDesignSystemShowcaseView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/ThemeDesignSystemShowcaseView.tsx`  
Categoría: Banco de Pruebas & Calibrador UI/UX a Pantalla Completa  

Descripción y Arquitectura Explayada:
ThemeDesignSystemShowcaseView es un entorno de trabajo a pantalla completa diseñado para que desarrolladores y diseñadores prueben, calibren y afinen la interfaz de usuario en vivo bajo cualquier tema activo. Ofrece una maqueta exhaustiva de componentes (Tarjetas KPI, Fichas de festival, Formularios, Inputs, Selects, Alertas, Botones de acción y Tablas) que responden de forma transparente al selector de temas y a un editor de estilos avanzado en tiempo real con inyección dinámica de CSS variables y exportador de código oficial.

---

## 🎬 17. ProjectsHomeView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/ProjectsHomeView.tsx`  
Categoría: Selector de Obras, Hub Multi-Tenant Central y Vestíbulo Móvil  

Descripción y Arquitectura Explayada:
ProjectsHomeView es el vestíbulo y puerta de entrada multi-obra de Festis. Al ingresar el usuario a la plataforma o deseleccionar la obra activa, ProjectsHomeView presenta un entorno optimizado ergonómicamente para dispositivos móviles y escritorio sin mostrar la barra de navegación inferior ni cabeceras internas de trabajo.

Incorpora un header flotante propio despegado de los bordes superiores y laterales (sticky top-3 mx-4 max-w-xl rounded-2xl) con desenfoque de fondo (backdrop-blur-xl), buscador transversal integrado que filtra proyectos en tiempo real por nombre de obra, resolución técnica (1080p, 4K) y etiquetas o tags, y el botón de apertura del menú lateral situado en el extremo derecho para facilitar el alcance táctil con el pulgar de la mano derecha. El menú lateral (drawer) se despliega y anima desde el lateral derecho (slide-in-from-right) y contiene estrictamente 3 opciones: Configuración de la App (navega hacia AppSettingsView), Ayuda y Cerrar Sesión (con temporizador de seguridad de 5 segundos). En la esquina inferior derecha se sitúa un botón flotante FAB "+ Nuevo Proyecto" de alta accesibilidad táctil para el alta ágil de nuevas producciones audiovisuales. Al seleccionar una obra, se actualiza el `currentProject` en el `ProjectContext`, habilitando el acceso a sus subcolecciones de festivales, planes y materiales.

---

## ⚙️ 18. AppSettingsView.tsx

Ficha Técnica del Componente:
Ubicación: `src/components/AppSettingsView.tsx`  
Categoría: Vista de Ajustes Globales, Sistema de Respaldo y Diagnóstico  

Descripción y Arquitectura Explayada:
AppSettingsView es la vista independiente de configuración del sistema accesible directamente desde el vestíbulo de proyectos sin requerir tener una obra activa seleccionada. Integra una cabecera con botón de retorno al catálogo de obras, ficha de perfil del usuario activo y un selector del tema visual del sistema (Cardigan Claro, Cardigan Noche y Cardigan Boceto) sincronizado a través de SkinContext.

La vista alberga los motores de exportación e importación blindada de bases de datos. El motor de exportación consulta en Firestore todas las obras pertenecientes al usuario activo (`createdBy == user.email`) e itera recursivamente todas sus subcolecciones (festivals, film_data, distribution_plans, institutions, gallery, social_posts, reminders, notes, roadmap) para compilar y descargar un archivo JSON con timestamp en milisegundos. El motor de importación implementa un protocolo de seguridad con triple barrera obligatoria: 1) Inspección previa con validación de estructura y detección de duplicados renombrando con la leyenda '(Copia importada)', 2) Confirmación textual estricta requiriendo tipear 'IMPORTAR', y 3) Bloqueo temporal con cuenta regresiva de 5 segundos en el botón final de confirmación. La escritura en Firestore se ejecuta mediante lotes divididos en bloques de 400 operaciones (safeBatchCommit) para evitar desbordar el límite de 500 operaciones por batch. Adicionalmente, cuenta con un módulo de diagnóstico y limpieza de caché local.

