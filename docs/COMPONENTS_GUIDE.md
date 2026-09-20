# Guía Maestra del Sistema de Componentes UI

Bienvenido a la especificación maestra de componentes de **Festis Cardigan**. Este documento actúa como la central de arquitectura visual, modular y de interfaz del sistema.

Para facilitar la comprensión detallada a desarrolladores, ingenieros de software y mantenedores, el sistema se compone de 4 subsistemas especializados. A continuación se presenta cada componente estructurado formalmente sin viñetas, con su archivo fuente, responsabilidad principal y alcance funcional.

---

## 🖥️ Subsistema 1: Vistas Principales del Sistema

Las Vistas Principales representan los módulos de pantalla completa de la aplicación, integrados dinámicamente en la barra de navegación lateral y el router central.

[👉 Abrir Documentación Detallada de Vistas Principales](/docs/COMPONENTS_MAIN_VIEWS.md)

### 📱 FestivalListView
Ubicación del Archivo: `src/components/FestivalListView.tsx`  
Descripción Detallada: Catálogo central de postulaciones que ofrece visualización conmutable entre cuadrícula gráfica de tarjetas (Grid) y tabla compacta de alta densidad (Table). Implementa un motor de búsqueda fuzzy con resaltado automático de coincidencia textual mediante la etiqueta `<mark>`, filtrado dinámico por estado o plataforma, ordenamiento multinivel por fecha límite o costo, y fijado visual de convocatorias prioritarias.

### 🔍 FestivalDetailsView
Ubicación del Archivo: `src/components/FestivalDetailsView.tsx`  
Descripción Detallada: Ficha técnica detallada e inspección profunda de una postulación individual. Presenta una línea de tiempo (timeline) cronológica con el historial auditable de veredictos, desglose financiero acumulado por gastos directos e indirectos, checklist interactivo de tareas operativas asociadas y accesos de edición.

### 📊 StatsView
Ubicación del Archivo: `src/components/StatsView.tsx`  
Descripción Detallada: Panel de inteligencia analítica y métricas de rendimiento. Utiliza el motor vectorial Recharts y D3 para proyectar gráficos interactivos de tasa de aceptación porcentual, distribución de postulaciones por país y plataforma, historial de inversión acumulada en fees y cálculo automatizado del costo promedio por selección obtenida.

### 📅 CalendarView
Ubicación del Archivo: `src/components/CalendarView.tsx`  
Descripción Detallada: Calendario reactivo mensual y semanal diseñado específicamente para el circuito de festivales. Mapea e identifica cromáticamente tres fechas críticas por postulación: la fecha límite de entrega (deadline), la fecha estimada de fallo del jurado (newsDate) y la fecha de proyección en sala de cine (projectionDate).

### 🚀 DashboardView
Ubicación del Archivo: `src/components/DashboardView.tsx`  
Descripción Detallada: Consola ejecutiva de entrada a la plataforma. Agrupa en un único panel de control los indicadores clave de rendimiento (KPIs), el carrusel de festivales anclados con notas rápidas, la agenda de entregas para el día de hoy y el listado de cierres de convocatoria más inminentes.

### 📋 TasksView
Ubicación del Archivo: `src/components/TasksView.tsx`  
Descripción Detallada: Gestor global unificado de tareas operativas. Consolida todas las tareas individuales incrustadas dentro de los festivales, permitiendo su filtrado por estado de finalización, fecha de vencimiento y asignación de responsables.

### 🎯 PlanningView
Ubicación del Archivo: `src/components/PlanningView.tsx`  
Descripción Detallada: Tablero de planificación previa estilo Kanban. Permite a los distribuidores investigar, evaluar e iterar sobre festivales candidatos antes de realizar la inscripción formal y efectuar el pago de los fees correspondientes.

### 🎬 FilmDataView
Ubicación del Archivo: `src/components/FilmDataView.tsx`  
Descripción Detallada: Ficha técnica oficial de la obra cinematográfica. Almacena metadatos esenciales como sinopsis en múltiples idiomas, créditos del equipo técnico (dirección, producción, guion, fotografía), enlaces de visionado privado (Vimeo, YouTube) con sus contraseñas y códigos de acreditación.

### 📝 ProductionNotes
Ubicación del Archivo: `src/components/ProductionNotes.tsx`  
Descripción Detallada: Bitácora de anotaciones estratégicas y minutas de trabajo. Proporciona un entorno de redacción para registrar acuerdos de distribución, estrategias de prensa y comentarios recibidos de programadores.

### 📄 ReportsView
Ubicación del Archivo: `src/components/ReportsView.tsx`  
Descripción Detallada: Motor de generación e impresión de reportes ejecutivos. Utiliza librerías cliente para compilar dossiers institucionales en formato PDF listos para presentar ante instituciones de fomento audiovisual, además de posibilitar la exportación completa de datos en formato CSV y Excel.  
[👉 Abrir Documentación Detallada del Sistema de Informes](/docs/REPORTS_AND_EXPORTS.md)

### 📦 ArchiveView
Ubicación del Archivo: `src/components/ArchiveView.tsx`  
Descripción Detallada: Depósito de almacenamiento histórico. Conserva los festivales marcados como archivados o correspondientes a temporadas anteriores, manteniendo limpia la vista principal sin perder la trazabilidad de postulaciones pasadas.

### 🖼️ GalleryView
Ubicación del Archivo: `src/components/GalleryView.tsx`  
Descripción Detallada: Catálogo multimedia e inspección visual. Ofrece una cuadrícula con lightbox para examinar afiches en alta resolución, laureles promocionales en formato PNG transparente y fotogramas oficiales de la película.

### ⚙️ ConfigView
Ubicación del Archivo: `src/components/ConfigView.tsx`  
Descripción Detallada: Panel de configuración de usuario y preferencias del sistema. Permite gestionar el tema visual (Claro/Oscuro), verificar el estado de sincronización en tiempo real con Firestore y acceder a la Wiki Técnica Interactiva in-app.

### ❓ HelpView
Ubicación del Archivo: `src/components/HelpView.tsx`  
Descripción Detallada: Centro de ayuda y conocimiento. Resuelve preguntas frecuentes relativas a la distribución, proporciona explicaciones sobre el cálculo de métricas financieras y lista los atajos de teclado globales.

### 📚 DocsWikiView
Ubicación del Archivo: `src/components/DocsWikiView.tsx`  
Descripción Detallada: Interfaz web interactiva para la documentación en Markdown. Renderiza en tiempo real los archivos `.md` del repositorio con resaltado de sintaxis, menú lateral en árbol desplegable y barra inferior flotante de utilidades.

---

## 🪟 Subsistema 2: Modales e Interacciones Globales

Componentes flotantes de captura de datos, auditoría de estados y paleta de comandos globales.

[👉 Abrir Documentación Detallada de Modales e Interacciones](/docs/COMPONENTS_MODALS.md)

### 📝 FestivalModal
Ubicación del Archivo: `src/components/FestivalModal.tsx`  
Descripción Detallada: Formularios multicampo para la creación y modificación de postulaciones. Incluye validaciones en tiempo real de campos obligatorios, selector de plataformas reconocidas (FilmFreeway, Shortfilmdepot, Festhome, Movibeta) e integración del componente `PlaceAutocomplete.tsx` para geolocalizar la sede.

### 🔄 ChangeStatusModal
Ubicación del Archivo: `src/components/ChangeStatusModal.tsx`  
Descripción Detallada: Modal auditable para registrar el cambio de estado de un festival. Captura el nuevo veredicto, permite ajustar la fecha exacta en que fue notificado y requiere una nota justificativa para mantener el historial cronológico intacto.

### ⌨️ OmniboxModal
Ubicación del Archivo: `src/components/OmniboxModal.tsx`  
Descripción Detallada: Paleta de comandos ultrarrápida activable mediante la combinación de teclas `Cmd + K` o `Ctrl + K`. Permite la búsqueda instantánea de festivales, cambio de vistas y ejecución de acciones globales sin necesidad de utilizar el ratón.

### 🚨 GlobalModals
Ubicación del Archivo: `src/components/GlobalModals.tsx`  
Descripción Detallada: Orquestador centralizado de diálogos de confirmación del sistema. Maneja advertencias de eliminación definitiva, mensajes de error crítico y avisos de pérdida de conexión a internet.

### 🗺️ MapReportModal
Ubicación del Archivo: `src/components/MapReportModal.tsx`  
Descripción Detallada: Visor geográfico interactivo con soporte para mapas. Proyecta marcadores en las ciudades donde el cortometraje o largometraje ha sido seleccionado, proyectado o premiado.

### ⏰ ReminderModal
Ubicación del Archivo: `src/components/ReminderModal.tsx`  
Descripción Detallada: Programador de recordatorios y alertas. Permite establecer notificaciones Push Web a través de Firebase Cloud Messaging (FCM) para evitar pasar por alto los cierres de convocatorias.

---

## 📱 Subsistema 3: Módulos Temáticos, Social Media y Reportes

Widgets especializados del Dashboard, simuladores de prensa para redes y conectores cloud.

[👉 Abrir Documentación Detallada de Módulos y Redes](/docs/COMPONENTS_MODULES.md)

### 📌 PinnedFestivalsList
Ubicación del Archivo: `src/components/PinnedFestivalsList.tsx`  
Descripción Detallada: Carrusel interactivo de festivales fijados por el usuario. Despliega notas adhesivas rápidas para recordar acciones prioritarias inmediatas antes del envío.

### 📅 TodaysAgendaList
Ubicación del Archivo: `src/components/TodaysAgendaList.tsx`  
Descripción Detallada: Widget de agenda diaria que filtra automáticamente las entregas y tareas cuya fecha de vencimiento coincide con la jornada actual.

### ⏳ UpcomingDeadlinesList
Ubicación del Archivo: `src/components/UpcomingDeadlinesList.tsx`  
Descripción Detallada: Listado cronológico de cierres de inscripción inminentes equipado con código de colores e indicadores de urgencia según los días restantes para la fecha límite.

### 📱 SocialMediaView & SocialMediaBoard
Ubicación del Archivo: `src/components/SocialMediaView.tsx`  
Descripción Detallada: Panel de planificación de contenidos para redes sociales. Permite organizar y redactar los anuncios oficiales de selecciones y premios obtenidos.

### 📸 InstagramSimulator & SocialMediaPreview
Ubicación del Archivo: `src/components/InstagramSimulator.tsx`  
Descripción Detallada: Generador gráfico con previsualización fidedigna del feed de Instagram. Se conecta con el servidor backend mediante la API de Google Gemini para redactar automáticamente textos promocionales y montar afiches con laureles.

### 📁 DriveFolderExplorer
Ubicación del Archivo: `src/components/DriveFolderExplorer.tsx`  
Descripción Detallada: Explorador incrustado para la inspección directa de carpetas de Google Drive. Facilita la previsualización de carpetas públicas que contienen press kits, archivos ProRes o fotos de rodaje.

### 📈 StatusVelocityReport
Ubicación del Archivo: `src/components/StatusVelocityReport.tsx`  
Descripción Detallada: Herramienta de analítica avanzada que calcula el tiempo medio de respuesta en días desde la fecha de envío de la postulación hasta la publicación de la lista oficial de seleccionados.

---

## 🛠️ Subsistema 4: Herramientas, Diagnóstico y Shaders

Herramientas de auditoría in-app, depuración de Firestore, fondos WebGL y defensas del sistema.

[👉 Abrir Documentación Detallada de Herramientas y Shaders](/docs/COMPONENTS_TOOLS_UTILS.md)

### 💻 DebugConsole & FirestoreDebugger
Ubicación del Archivo: `src/components/DebugConsole.tsx` / `src/components/FirestoreDebugger.tsx`  
Descripción Detallada: Consolas de inspección técnica integradas en la aplicación. Permiten monitorear los registros de log del sistema, la latencia de los sockets de Firestore, el estado del almacenamiento IndexedDB offline y las lecturas/escrituras en tiempo real.

### 🔍 KeyDuplicatesInspector
Ubicación del Archivo: `src/components/KeyDuplicatesInspector.tsx`  
Descripción Detallada: Inspector de integridad de datos. Analiza la colección de festivales para identificar registros duplicados por nombre o URL de plataforma, garantizando la consistencia de las estadísticas financieras.

### 🌊 OceanShader & ShaderConfigGroup
Ubicación del Archivo: `src/components/OceanShader.tsx` / `src/components/ShaderConfigGroup.tsx`  
Descripción Detallada: Lienzo de renderizado Three.js y WebGL 3D. Genera un fondo marino animado personalizable con controles de velocidad, rugosidad de onda y paleta cromática.

### 📍 PlaceAutocomplete
Ubicación del Archivo: `src/components/PlaceAutocomplete.tsx`  
Descripción Detallada: Campo de búsqueda con autocompletado geográfico integrado con la API de Google Maps Places para validar la ciudad y país de las sedes.

### 🛡️ ErrorBoundary
Ubicación del Archivo: `src/components/ErrorBoundary.tsx`  
Descripción Detallada: Componente de contención defensiva en React. Intercepta excepciones no controladas en el árbol de componentes y despliega una pantalla de recuperación sin colapsar la aplicación.
