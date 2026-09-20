# Arquitectura del Sistema - Festis (Multi-Tenant Audiovisual)

Este documento proporciona una especificación técnica completa e integral de la arquitectura de software, la estructura del proyecto, el ciclo de vida de ejecución, el manejo de estado y el sistema de compilación de **Festis**.

> 📌 **Fuente Canónica de Verdad Absoluta**: Para la especificación técnica exhaustiva de cada interfaz de TypeScript, contratos de API de servidor, reglas de Firestore y algoritmos de compresión multimedia, consultar directamente el archivo [`SPEC.md`](../SPEC.md) en la raíz del repositorio.

---

## 🏗️ 1. Resumen Arquitectónico Multi-Tenant

```
┌─────────────────────────────────────────────────────────┐
│                    React SPA Frontend                   │
│         ProjectContext (Proyecto Activo / Multi-obra)    │
│  (Views: Home Obras, Dashboard, Festivales, Stats, etc) │
└───────────────────────────┬─────────────────────────────┘
                            │
              State Sync & Optimistic UI
                            │
┌───────────────────────────▼─────────────────────────────┐
│                 Firebase Firestore SDK                  │
│                 Firebase Firestore SDK                  │
│       Base de datos vinculada: festis-db-a              │
│       Storage Bucket vinculado: festis-bucket-a         │
│       Rutas jerárquicas: projects/{projectId}/...       │
└─────────────────────────────────────────────────────────┘
```

El sistema opera como una Single Page Application (SPA) responsiva multi-tenant construida con React 19, Vite y TypeScript, combinada con Tailwind CSS para el diseño visual. La persistencia de datos utiliza **Firebase Firestore** vinculada a la base de datos `festis-db-a` y Cloud Storage `festis-bucket-a` para sincronización bidireccional en tiempo real mediante WebSockets (`onSnapshot`), ofreciendo resiliencia local con fallbacks optimistas en `localStorage`.

### 🧭 Ruteo y Layouts Diferenciados (Inicio vs. Obra Activa)

1. **Pantalla de Inicio (`ProjectsHomeView`)**: Se monta exclusivamente cuando no hay un proyecto seleccionado (`!currentProject`).
   - **App Header Exclusivo y Sticky**: Posición fija/sticky en la parte superior que permanece visible durante el scroll del catálogo de obras. Contiene únicamente el botón para abrir la sidebar reducida y el input de búsqueda transversal en tiempo real (por nombre de obra, resolución técnica y etiquetas/tags).
   - **Sidebar Reducida**: Panel lateral minimalista que incluye únicamente *Configuración de la App*, *Ayuda* y al pie *Cerrar Sesión* (con modal de confirmación y cuenta regresiva de 5 segundos).
   - **Aislamiento Funcional**: Se suprime en su totalidad el montaje del AppHeader de obra, la barra de navegación inferior (Bottom Bar) y el botón flotante de agregar festival (los festivales solo existen dentro de un proyecto activo).

2. **Entorno de Obra Activa (`currentProject != null`)**: Monta el AppHeader completo con filtros técnicos, paleta cromática de la obra, navegación inferior (Bottom Bar), vistas de festivales, calendario, estadísticas, tareas y el botón flotante unificado para registrar festivales dentro de la obra.

Cada obra o proyecto audiovisual cuenta con su propio identificador y subcolecciones aisladas (`festivals`, `distribution_plans`, `institutions`, `filmData`, `reminders`, `notes`, `gallery`, `social_posts`). El acceso a cada subcolección está protegido mediante reglas de seguridad de Firestore que validan la pertenencia del usuario al arreglo `authorizedUsers` o al campo `createdBy` del proyecto padre.

---

## 🌳 2. Estructura Exhaustiva del Proyecto

El código fuente está estrictamente modularizado para garantizar la mantenibilidad y escalabilidad. A continuación se detalla la jerarquía completa del repositorio:

```
festis-cardigan/
├── docs/                         # Documentación técnica interactiva del proyecto (Wiki)
│   ├── API_AND_INTEGRATIONS.md   # Especificación de Firebase, Google Maps, OAuth y APIs externas
│   ├── ARCHITECTURE.md           # [Este Documento] Estructura, runtime, flujo de datos y build
│   ├── COMPONENTS_GUIDE.md       # Guía e inventario exhaustivo de los 48 componentes UI
│   ├── DATA_MODEL.md             # Modelado de datos TypeScript, esquemas de Firestore e interfaces
│   ├── SERVICES_AND_HELPERS.md   # Documentación de helpers, utilidades matemáticas y conectores
│   └── TESTING_AND_DEPLOYMENT.md # Estrategias de testing, linter, compilación y despliegue
│
├── public/                       # Assets estáticos servidos directamente por el servidor web
│   ├── favicon.ico               # Isotipo oficial de la aplicación
│   └── icons/                    # Logos e isotipos de plataformas de festivales
│
├── src/                          # Código fuente principal de la aplicación frontend
│   ├── main.tsx                  # Punto de entrada de montaje del árbol DOM de React
│   ├── App.tsx                   # Componente raíz, orquestador de estado global y vistas
│   ├── index.css                 # Estilos globales y directivas de Tailwind CSS
│   ├── types.ts                  # Definiciones de tipos TypeScript, interfaces y enums compartidos
│   ├── firebase.ts               # Inicialización del SDK de Firebase (Firestore & Auth)
│   │
│   ├── components/               # Componentes UI (Vistas, Modales y Modulares)
│   │   ├── AppHeader.tsx         # Barra superior persistente y selector de navegación
│   │   ├── FestivalListView.tsx  # Vista de lista/rejilla de festivales con buscador y filtros
│   │   ├── FestivalDetailsView.tsx# Vista detallada con historial, tareas y costos
│   │   ├── DashboardView.tsx     # Tablero ejecutivo con indicadores y convocatorias prioritarias
│   │   ├── StatsView.tsx         # Módulo analítico interactivo con gráficos Recharts
│   │   ├── CalendarView.tsx      # Calendario de fechas límite, notificaciones y proyecciones
│   │   ├── TasksView.tsx         # Centro de control de pendientes y tareas asignadas
│   │   ├── PlanningView.tsx      # Tablero Kanban para pre-selección y presupuesto de festivales
│   │   ├── FilmDataView.tsx      # Ficha técnica, sinopsis y enlaces de visionado
│   │   ├── ProductionNotes.tsx   # Bitácora y cuaderno de notas de producción
│   │   ├── ReportsView.tsx       # Generador de reportes PDF y exportaciones CSV
│   │   ├── ArchiveView.tsx       # Depósito histórico de ediciones pasadas
│   │   ├── GalleryView.tsx       # Galería de afiches, fotogramas y assets de prensa
│   │   ├── ConfigView.tsx        # Configuración del sistema, preferencias y acceso a Wiki
│   │   ├── HelpView.tsx          # Centro de ayuda y preguntas frecuentes
│   │   ├── DocsWikiView.tsx      # Portal interactivo in-app para renderizado de documentos Markdown
│   │   ├── BugsRoadmapView.tsx   # Sistema interno de seguimiento de bugs e itinerario
│   │   ├── BugTracker.tsx        # Widget flotante para reporte de errores
│   │   ├── DebugConsole.tsx      # Consola de depuración en tiempo real
│   │   ├── FirestoreDebugger.tsx # Herramienta de auditoría de conexión Firestore
│   │   ├── KeyDuplicatesInspector.tsx # Inspector de colisión de IDs en colecciones
│   │   ├── OceanShader.tsx       # Fondo animado WebGL/Three.js
│   │   ├── ShaderConfigGroup.tsx # Panel de control de parámetros del Shader
│   │   ├── Models3D.tsx          # Visor de modelos tridimensionales
│   │   ├── PlayZoneView.tsx      # Entorno de pruebas interactivo
│   │   ├── EasterEgg.tsx         # Componente sorpresa interactivo
│   │   ├── AdvancedCharts.tsx    # Gráficos vectoriales complejos (D3 / Recharts)
│   │   ├── FestivalModal.tsx     # Formulario modal de creación/edición de festival
│   │   ├── ChangeStatusModal.tsx # Modal de actualización de estado auditable
│   │   ├── OmniboxModal.tsx      # Paleta de comandos (Cmd+K / Ctrl+K)
│   │   ├── GlobalModals.tsx      # Orquestador de modales de confirmación
│   │   ├── MapReportModal.tsx    # Visor geográfico de sedes de festivales
│   │   ├── ReminderModal.tsx     # Programador de alertas temporales
│   │   ├── NetworkStatusBadge.tsx# Estado de conexión a internet (Online/Offline)
│   │   ├── HandDrawnIcons.tsx    # Biblioteca de iconos SVG dibujados a mano
│   │   ├── PlatformIcon.tsx      # Renderizador de logotipos de plataformas de distribución
│   │   ├── PlaceAutocomplete.tsx # Campo con autocompletado de ubicaciones de Google Maps
│   │   ├── ErrorBoundary.tsx     # Capturador de excepciones en el árbol React
│   │   │
│   │   ├── dashboard/            # Subcomponentes del tablero principal
│   │   │   ├── PinnedFestivalsList.tsx    # Lista de festivales destacados
│   │   │   ├── TodaysAgendaList.tsx       # Convocatorias que vencen hoy
│   │   │   └── UpcomingDeadlinesList.tsx  # Cierres próximos en los siguientes 7-30 días
│   │   │
│   │   ├── social_media/         # Módulo de gestión y marketing en redes sociales
│   │   │   ├── SocialMediaView.tsx        # Contenedor principal de redes
│   │   │   ├── SocialMediaBoard.tsx       # Tablero Kanban de publicaciones
│   │   │   ├── SocialMediaAgenda.tsx      # Calendario de contenidos
│   │   │   ├── InstagramSimulator.tsx     # Simulador visual de feed/stories de Instagram
│   │   │   ├── SocialMediaPreview.tsx     # Previsualizador de posts con copy y hashtags
│   │   │   └── DriveFolderExplorer.tsx    # Conector a material gráfico en Google Drive
│   │   │
│   │   └── reports/              # Módulos analíticos de reportes avanzados
│   │       └── StatusVelocityReport.tsx   # Métrica de velocidad de veredicto de festivales
│   │
│   ├── hooks/                    # Custom Hooks reutilizables
│   │   ├── useFestivals.ts       # Sincronización en tiempo real con Firestore y fallback local
│   │   ├── useAuth.ts            # Estado de autenticación Firebase Auth
│   │   ├── useLocalStorage.ts    # Persistencia local reactiva en la API Web Storage
│   │   └── useDebounce.ts        # Control de frecuencia para optimización de búsquedas
│   │
│   └── utils/                    # Funciones auxiliares y lógica pura
│       ├── helpers.ts            # Motor de búsqueda diacrítica, formateadores y conversiones
│       └── exportUtils.ts        # Exportación a Excel/CSV y generación de reportes PDF
│
├── server.ts                     # Servidor Express de backend y middleware de desarrollo Vite
├── package.json                  # Manifiesto de dependencias npm y scripts del proyecto
├── tsconfig.json                 # Configuración del compilador TypeScript
├── vite.config.ts                # Configuración de Vite (Plugins, Alias, Server Proxy)
├── metadata.json                 # Metadatos del applet en la plataforma AI Studio
└── firebase-applet-config.json   # Configuración de vinculación de Firebase en el entorno
```

---

## 🔄 3. Flujo de Ejecución y Runtime (Runtime Lifecycle)

El ciclo de vida de la aplicación sigue una secuencia estrictamente reactiva e ininterrumpida:

```
[HTML Index (Native Splash)] ──> [main.tsx] ──> [ErrorBoundary]
                                                     │
                                         ┌───────────┴───────────┐
                                         ▼                       ▼
                                   [AuthProvider]       [React.Suspense]
                                (Firebase Auth Init)    (AppSplashScreen)
                                                                 │
                                                       [React.lazy(App.tsx)]
                                                                 │
                                         ┌───────────────────────┴───────────────────────┐
                                         ▼                                               ▼
                                  [Firebase Init]                              [useFirestoreSyncArray]
                               (Auth & Firestore SDK)                           (onSnapshot / Realtime)
                                         │                                               │
                                         └───────────────────────┬───────────────────────┘
                                                                 ▼
                                                       [React State Router]
                                                    (Render Active ViewMode)
```

1. **Inicialización DOM y Desacoplamiento (`main.tsx`):**
   - Se ejecuta en el cliente montando inmediatamente React con `React.lazy(() => import('./App.tsx'))` dentro de `<React.Suspense fallback={<AppSplashScreen />}>`.
   - Esto desacopla el montaje del DOM del tiempo de descarga de `App.tsx` (135 KB y 40+ módulos), previniendo bloqueos del hilo principal en conexiones móviles.
   - Se envuelve la app en un `<ErrorBoundary>` para interceptar cualquier fallo no controlado sin romper la sesión.

2. **Inicialización de Firebase (`src/firebase.ts`):**
   - Se cargan las credenciales desde las variables de entorno.
   - Se instancian los servicios `getAuth()` y `getFirestore()`.

3. **Carga Bajo Demanda de Motores Pesados (Code-Splitting):**
   - Las librerías de exportación de alto impacto (`jspdf`, `xlsx`, `jszip`) están desacopladas del bundle inicial mediante `await import(...)` dinámico, descargándose únicamente cuando el usuario solicita una exportación a PDF, Excel o backup ZIP.

4. **Sincronización en Tiempo Real (`useFirestoreSyncArray.ts`):**
   - Al cargar `App.tsx`, el hook suscribe un oyente en tiempo real `onSnapshot` a la colección `festivals` de Firestore.
   - Si la red está activa, los datos en Firestore alimentan el estado `festivals`.
   - Si no hay conexión o se produce un retraso, el hook conmuta transparentemente a `localStorage` como capa de resiliencia.

5. **Enrutamiento por Estado Interno (`App.tsx`):**
   - En lugar de usar un enrutador basado en URL (que puede ser bloqueado por el iframe del sandbox), la navegación se gestiona mediante el estado `currentView: ViewMode` (`"list"`, `"details"`, `"stats"`, `"calendar"`, `"dashboard"`, `"docs"`, etc.).
   - Al cambiar de vista, el layout re-renderiza con animaciones de transición suaves.

---

## 🧩 4. Arquitectura de Estado y Hooks Personalizados

El manejo de datos combina React State, Custom Hooks y Sincronización Directa:

### Custom Hooks Principales

1. **`useFestivals()`:**
   - **Responsabilidad:** Encapsula las operaciones CRUD (Crear, Leer, Actualizar, Borrar) sobre la colección de festivales.
   - **Comportamiento Optimista:** Aplica mutaciones de manera inmediata en el estado de React y luego las persiste en Firestore, garantizando que la UI responda a 0 ms de latencia.

2. **`useAuth()`:**
   - **Responsabilidad:** Gestiona la sesión del usuario (`currentUser`), estado de carga inicial (`loading`) y llamadas a `signInWithPopup`, `signOut` o login anónimo.

3. **`useLocalStorage<T>(key, initialValue)`:**
   - **Responsabilidad:** Sincroniza estados de preferencia (como `isDarkMode`, `compactView`, `filterPreferences`) con `window.localStorage`.

4. **`useDebounce<T>(value, delay)`:**
   - **Responsabilidad:** Retarda la propagación del término de búsqueda en `FestivalListView` (300 ms) para evitar filtros innecesarios en cada pulsación de tecla.

---

## 📑 5. Ciclo de Vida del Estado y Trazabilidad (`statusHistory`)

Cada festival registrado mantiene un registro cronológico e inmutable dentro de su propiedad `statusHistory`:

```typescript
interface StatusHistoryEntry {
  id: string;
  status: FestivalStatus;
  timestamp: string; // ISO 8601 (Ej: "2026-07-30T23:55:00.000Z")
  updatedBy?: string;
  note?: string;
}
```

### Reglas de Negocio e Integridad:
- **Trazabilidad Absoluta:** Cada vez que el estado de un festival cambia (ej. de "Enviado" a "Seleccionado"), el modal `ChangeStatusModal` requiere una fecha de confirmación y una nota explicativa opcional.
- **Historial Editable Retroactivamente:** El usuario puede especificar fechas pasadas para reflejar veredictos recibidos por correo con días de retraso, manteniendo las estadísticas sincronizadas.
- **Consultas Temporales en Estadísticas:** El módulo `StatsView` procesa el array `statusHistory` de todos los festivales para reconstruir métricas históricas precisas por rango de fechas (Semana, Mes, Año).

---

## 🔍 6. Motor de Búsqueda y Normalización

La función de búsqueda `searchFestivals(festivals, query)` en `src/utils/helpers.ts` ejecuta un pipeline de filtrado de 4 etapas:

1. **Normalización Diacrítica:** Eliminación de acentos/tildes y conversión a minúsculas (`String.normalize('NFD')`).
2. **Búsqueda Directa:** Coincidencia de subcadena en campos principales: `name`, `city`, `country`, `platform`, `categories`.
3. **Tokenización Multipalabra:** División de la consulta en palabras clave independientes; se requiere que **todos los tokens** coincidan con algún atributo del festival.
4. **Resaltado Inteligente:** Retorno de rangos de coincidencia para renderizado visual mediante la etiqueta HTML `<mark>`.

---

## 📦 7. Sistema de Compilación, Bundling e Infraestructura

El proyecto sigue una arquitectura Híbrida/Full-stack basada en Express y Vite:

```
                  ┌───────────────────────────────┐
                  │    npm run build (Command)    │
                  └──────────────┬────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
     [Vite Client Bundler]             [esbuild Server Bundler]
   Compila SPA a 'dist/'            Empaqueta 'server.ts' en
   (index.html, JS, CSS)            'dist/server.cjs' (CommonJS)
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                    [node dist/server.cjs (Start)]
                Servidor unificado en Puerto 3000 (0.0.0.0)
```

### Entorno de Desarrollo vs Producción

- **Entorno de Desarrollo (`npm run dev`):**
  - Ejecuta `tsx server.ts`.
  - El servidor Express integra Vite como Middleware en modo SPA (`createViteServer`), ofreciendo recarga rápida de módulos y compilación al vuelo.
- **Entorno de Producción (`npm run build` & `npm start`):**
  1. Vite genera todos los archivos estáticos cliente optimizados dentro del directorio `dist/`.
  2. `esbuild` empaqueta `server.ts` en un único archivo ejecutable `dist/server.cjs` (formato CommonJS).
  3. `npm start` ejecuta `node dist/server.cjs`, escuchando obligatoriamente en el puerto `3000` e interfaz `0.0.0.0` para despliegue en contenedores Cloud Run.

---

## 8. Ciclo de Arranque y Splash Screen Temático

Para garantizar una experiencia fluida sin pantallas en blanco ni bloqueos en dispositivos móviles y conexiones con latencia, la aplicación implementa un sistema de carga en tres fases:

1. **Splash Screen Nativo en `index.html` (Milisegundo 0):**
   - El contenedor `<div id="root">` aloja directamente un Splash Screen tematizado con degradado pastel animado (`#fce7f3`, `#e0e7ff`, `#e0f2fe`, `#fef3c7`), tipografía "Cargando...", un spinner circular giratorio en rosa `#e91e63`, monitor dinámico de red y botón de recarga de emergencia.
   - Utiliza la API nativa `PerformanceObserver` para rastrear en tiempo real los módulos y recursos que el navegador descarga de forma exacta (mostrando nombres de archivos y cantidad real de recursos descargados).
   - Posee listeners globales de `window.onerror` y `window.onunhandledrejection` que capturan fallos de red en el celular e informan el motivo exacto en lugar de quedar mudo.
2. **Relevo de Montaje Asíncrono en React (`main.tsx` + `AppSplashScreen.tsx`):**
   - React se monta de forma inmediata desacoplado de `App.tsx` usando `React.lazy` y `<React.Suspense fallback={<AppSplashScreen />}>`.
   - La inicialización de `AuthProvider` ocurre en paralelo sin bloquear el renderizado del splash screen.
3. **Carga y Desempaquetado del Catálogo (`App.tsx`):**
   - Los motores pesados de exportación (`jspdf`, `xlsx`, `jszip`) se cargan dinámicamente bajo demanda (`import(...)`), aligerando más de 2 MB del bundle inicial de la app.
   - En cuanto `loading` finaliza y `user` es validado, React monta el catálogo principal de festivales de forma atómica.

---

## 9. Hoja de Ruta: Migración a Multi-Proyecto (Multi-Tenant)

Para escalar la aplicación hacia una arquitectura multi-cliente, se planea la siguiente ruta de refactorización:

1. **Jerarquía en Firestore:**
   - Transicionar de la colección raíz `/festivals` a una estructura aislada por espacio de trabajo: `/projects/{projectId}/festivals/{festivalId}`.
2. **Contexto Global de Proyecto (`ProjectContext`):**
   - Implementar un selector de proyectos en `AppHeader` que conmute dinámicamente el `projectId` en los listeners de Firestore.
3. **Reglas de Seguridad y RBAC:**
   - Configurar Firestore Rules para validar el token JWT del usuario contra la lista de miembros autorizados `/projects/{projectId}/members/{userId}`.
