# ESPECIFICACIÓN TÉCNICA Y FUENTE DE VERDAD ABSOLUTA (SPEC.MD)

> **Festis: Cardigan — Plataforma Multi-Tenant de Gestión y Distribución Audiovisual**  
> Versión del Sistema: `10.sep.2026-a`  
> Base de Datos Oficial (Firestore): `festis-db-a`  
> Almacenamiento Oficial (Cloud Storage): `gs://festis-bucket-a`  
> Entorno de Ejecución: Google Cloud Run / Contenedor Node.js 22 + React 19 SPA

---

## 1. ARQUITECTURA GENERAL Y STACK TÉCNICO

### 1.1 Frontend
El frontend de Festis opera como una Single Page Application (SPA) con arquitectura desacoplada y tipado estricto mediante TypeScript.

*   **React (`19.0.1`) & React DOM (`19.0.1`)**: Emplea el compilador de React 19, componentes funcionales puros, Context API y hooks concurrentes.
*   **TypeScript (`~5.8.2`)**: Tipado estricto en modo `strict`, sin uso de tipos `any` implícitos ni estructuras fragmentadas.
*   **Vite (`6.2.3`) & `@vitejs/plugin-react` (`5.0.4`)**: Empaquetador y servidor de desarrollo optimizado. Integrado con `vite-plugin-node-polyfills` (`0.26.0`) para compatibilidad con módulos nativos en navegador (Buffer, Stream).
*   **Tailwind CSS v4 (`4.1.14`) & `@tailwindcss/vite` (`4.1.14`)**: Motor de estilos de última generación importado mediante `@import "tailwindcss";` nativo, complementado con utilidades como `clsx` (`2.1.1`) y `tailwind-merge` (`3.5.0`).
*   **Motion (`12.23.24`)**: Motor de animaciones layout y transiciones de estado importado desde `motion/react`.
*   **Visualización de Datos y Gráficos**:
    *   **Recharts (`3.8.1`)**: Renderizado de métricas analíticas, curvas de presupuesto y estadísticas de postulaciones.
    *   **D3 (`7.9.0`) & `@types/d3` (`7.4.3`)**: Cálculos de proyecciones, escalado matemático y renderizado de geometrías.
    *   **TopoJSON Client (`3.1.0`) & `@types/topojson-client` (`3.1.5`)**: Procesamiento de datos geoespaciales para cartografía mundial.
*   **Geolocalización y Mapas**:
    *   **Leaflet (`1.9.4`) & `@types/leaflet` (`1.9.21`)**: Motor de mapas interactivos.
    *   **React Leaflet (`5.0.0`)**: Enlace declarativo entre Leaflet y componentes de React 19.
    *   **Google Maps SDK (`@vis.gl/react-google-maps` `1.8.3`)**: Integración con Google Maps Platform.
*   **Gráficos 3D y Shaders**:
    *   **Three.js (`0.184.0`)**: Motor WebGL central.
    *   **React Three Fiber (`9.6.1`)**: Reconciliador declarativo de Three.js para React.
    *   **Drei (`10.7.7`)**: Colección de abstracciones y shaders para React Three Fiber.
    *   **Paper Design Shaders (`@paper-design/shaders-react` `0.0.76`)**: Shaders procedurales interactivos para fondos dinámicos y lienzos animados.
*   **Iconografía e Interacción**:
    *   **Lucide React (`0.546.0`)**: Biblioteca exclusiva de iconos SVG para la interfaz.
    *   **@hello-pangea/dnd (`18.0.1`)**: Tableros Kanban y reordenamiento de tareas mediante Drag and Drop.
    *   **Canvas Confetti (`1.9.4`) & `@types/canvas-confetti` (`1.9.0`)**: Efectos visuales de celebración en festivales seleccionados o ganados.
    *   **React Markdown (`10.1.0`)**: Renderizador seguro de documentos en Markdown para sinopsis, notas y bases de convocatorias.

### 1.2 Backend
El backend opera como un servidor Node.js híbrido que sirve simultáneamente las rutas de API REST (`/api/*`), los procesos en segundo plano y el middleware de Vite (o archivos estáticos de producción).

*   **Node.js (v22.x)**: Entorno de ejecución en contenedor Linux (Cloud Run).
*   **Express (`4.21.2`) & `@types/express` (`4.17.21`)**: Servidor HTTP principal montado sobre el puerto `3000` e interfaz `0.0.0.0`. Soporta payloads JSON y URL-encoded con límite expandido de `50mb`.
*   **TSX (`4.21.0`)**: Motor de ejecución TypeScript en desarrollo sin paso previo de compilación (`tsx server.ts`).
*   **esbuild (`0.28.0`)**: Empaquetador de producción que compila `server.ts` en un único archivo CJS optimizado: `dist/server.cjs` (`--bundle --platform=node --format=cjs --packages=external --sourcemap`).
*   **Node-Cron (`4.2.1`) & `@types/node-cron` (`3.0.11`)**: Planificador de tareas en segundo plano. Configurado para ejecutarse cada hora (`0 * * * *`) evaluando los vencimientos y preferencias horarias de cada usuario.
*   **Procesamiento de Lenguaje e Inteligencia Artificial**:
    *   **Groq SDK (`1.2.0`)**: Conexión de ultrabaja latencia para análisis de convocatorias mediante el modelo `llama-3.3-70b-versatile`.
    *   **Google GenAI (`@google/genai` `1.29.0`)**: Integración con el modelo `gemini-2.5-flash` para extracción multimodal de convocatorias desde imágenes, PDFs y consultas en lenguaje natural en Gemini Spark.
    *   **Hugging Face Inference API**: Proveedor de visión por computadora fallback para análisis de capturas (`meta-llama/Llama-3.2-11B-Vision-Instruct` y `Qwen/Qwen2-VL-7B-Instruct`).
*   **Web Scraping & DOM Parsing**:
    *   **Cheerio (`1.2.0`)**: Extracción y saneamiento de datos HTML de convocatorias remotas.

### 1.3 Conexión y Servicios Firebase
*   **Firebase Client SDK (`12.13.0`)**:
    *   Inicializado en `src/firebase.ts` utilizando la configuración provista en `firebase-applet-config.json`.
    *   `auth`: Instancia de autenticación con `GoogleAuthProvider` (forzando `prompt: 'select_account'`).
    *   `db`: Instancia de Cloud Firestore configurada explícitamente en la base de datos `festis-db-a`.
    *   `storage`: Instancia de Cloud Storage apuntando a `gs://festis-bucket-a`.
    *   `messagingPromise`: Servicio de Firebase Cloud Messaging condicionado por `isSupported()`.
*   **Firebase Admin SDK (`13.10.0`)**:
    *   Inicializado en el servidor mediante credenciales de cuenta de servicio (`FIREBASE_SERVICE_ACCOUNT`) o mediante Application Default Credentials (ADC).
    *   Gestiona el despacho masivo de notificaciones WebPush vía Firebase Cloud Messaging (`getMessaging().sendEach()`), la depuración automática de tokens expirados y el acceso de lectura en segundo plano para cron jobs y endpoints Spark.

---

## 2. ESQUEMA DE DATOS COMPLETO (src/types.ts y Firestore)

### 2.1 Modelos e Interfaces TypeScript (src/types.ts)
A continuación se transcriben de forma íntegra y textual todos los enums e interfaces que rigen el sistema sin omisiones:

```typescript
// Estados del ciclo de vida de un festival cinematográfico
export enum FestivalStatus {
  POR_ENVIAR = 'Por enviar',
  PROXIMAMENTE = 'Proximamente',
  EN_REVISION = 'En Revision',
  EN_DUDA = 'En duda',
  SELECCIONADO = 'Seleccionado',
  PROYECTADO = 'Proyectado',
  GANADO = 'Ganado',
  NO_SELECCIONADO = 'No Seleccionado',
  DESCALIFICADO = 'Descalificado',
  CERRADO = 'Cerrado'
}

// Configuración de apariencia y paleta cromática del proyecto activo
export interface ProjectThemeConfig {
  colorDominante: string; // HEX o variable CSS principal
  colorSub: string;       // HEX o variable CSS secundaria
  colorAcento: string;    // HEX o variable CSS de acento y botones activos
  tipoFondo: 'solido' | 'imagen' | 'gradiente_animado';
  valorFondo: string;     // Color HEX, URL en Firebase Storage o sintaxis de gradiente
}

// Miembro con rol asignado dentro de un proyecto específico
export interface ProjectMember {
  email: string;
  role: 'admin' | 'dev' | 'visitante' | 'externo';
}

// Entidad raíz de Proyecto / Obra Audiovisual (Colección /projects/{projectId})
export interface Project {
  id: string;
  name: string;
  iconUrl: string;
  fps: number;
  resolution: string; // Ej: "1920x1080", "4K UHD"
  createdBy: string;
  members: ProjectMember[];
  authorizedUsers: string[]; // Correos electrónicos planos en minúsculas para reglas de seguridad de Firestore
  theme: ProjectThemeConfig;
  tags?: string[];           // Etiquetas y palabras clave del proyecto
  description?: string;      // Sinopsis o descripción breve
  createdAt: string;
  updatedAt: string;
}

// Tarea o hito operativo vinculado a un festival o proyecto
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

// Elemento multimedia de la galería del proyecto (Subcolección /projects/{projectId}/gallery)
export interface GalleryItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  createdAt: string;
  category?: string;
}

// Ficha técnica completa de la obra (Subcolección /projects/{projectId}/film_data)
export interface FilmData {
  id: string;
  lang?: string;
  accentColor?: string;
  logoUrl?: string;
  posterUrl?: string;
  logoBase64?: string;
  bottomLogos: string[];
  history: {
    logline: string;
    synopsis: string;
  };
  techSpecs: {
    title: string;
    format: string;
    director: string;
    technique: string;
    date: string;
    genre: string;
    country: string;
    duration: string;
    music: string;
    rating: string;
    producedWithin: string;
  };
  biography: string;
  credits: { role: string; name: string; social: string }[];
  contactInfo: { title: string; subtitle: string; lines: { label: string; value: string; isLink?: boolean; linkUrl?: string }[] }[];
}

// Historial de cambios de estado de un festival
export interface StatusHistoryEntry {
  id?: string;
  status: FestivalStatus;
  previousStatus?: FestivalStatus;
  timestamp: string;
  updatedBy?: string;
  note?: string;
}

// Registro de festival cinematográfico (Subcolección /projects/{projectId}/festivals)
export interface Festival {
  id: string;
  name: string;
  country: string;
  type: string;
  status: FestivalStatus;
  statusHistory?: StatusHistoryEntry[];
  deadline?: string;
  newsDate?: string;
  category?: string;
  nomination?: string;
  link?: string;
  platform?: string;
  price?: string;
  fee?: number;
  observations?: string;
  projectionDate?: string;
  projectionLocation?: string;
  projectionLat?: number;
  projectionLng?: number;
  laurel?: string;
  laurelBg?: 'transparent' | 'white' | 'black';
  tasks: Task[];
  createdBy?: string;
  isPinned?: boolean;
  pinNote?: string;
  archived?: boolean;
  isTestFestival?: boolean;
  includeInStats?: boolean;
  editionYear?: number;
  editionNumber?: number;
  previousEditionId?: string;
  editionHistory?: Array<{ id: string; name: string; year?: number; status: FestivalStatus; createdAt?: string }>;
  createdAt?: string;
  updatedAt?: string;
  isPreliminary?: boolean;
  distributionPlanId?: string;
  distributionPlanName?: string;
  esBorradorPlan?: boolean;
  institucionNombre?: string;
  fechaAprobacionInstitucional?: string;
}

// Festivales detectados o sugeridos por IA
export interface ProposedFestival {
  id: string;
  name: string;
  country: string;
  type: string;
  status: 'pending' | 'saved' | 'discarded' | 'added';
  actualStatus?: FestivalStatus;
  deadline?: string;
  extendedDeadline?: string;
  category?: string;
  platform?: string;
  price?: string;
  link?: string;
  observations?: string;
  isHighPriority?: boolean;
  reasonsForSelection?: string;
  createdAt: string;
  scrapedAt: string;
}

// Configuración de búsqueda inteligente por IA
export interface AiSearchConfig {
  id: string;
  genre: string;
  maxDuration: number;
  maxPrice: number;
  originCountry: string;
  enabled: boolean;
}

// Notas de producción (Subcolección /projects/{projectId}/notes)
export interface AppNote {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  color?: string;
}

// Incidencias y bugs del proyecto (Subcolección /projects/{projectId}/bugs)
export interface BugTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  dateReported: string;
  author?: string;
}

// Hitos de la hoja de ruta (Subcolección /projects/{projectId}/roadmap)
export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed';
  quarter: string;
  author?: string;
}

// Notificación de sistema local o push
export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type?: 'info' | 'warning' | 'success' | 'alert';
  festivalId?: string;
}

// Miembro general o global del sistema
export interface AppMember {
  id: string;
  name: string;
  email: string;
  authorizedEmails: string[];
  role: 'dev' | 'admin' | 'visitante' | 'externo';
  birthday?: string;
}

// Registro global de auditoría
export interface AuditLog {
  id: string;
  timestamp: string;
  collection: string;
  details: string;
  user: string;
}

// Recordatorios personalizados (Subcolección /projects/{projectId}/reminders)
export interface Reminder {
  id: string;
  title: string;
  date: string;
  time?: string;
  festivalId?: string;
  createdAt: string;
  createdBy: string;
}

// Publicaciones para redes sociales (Subcolección /projects/{projectId}/social_posts)
export interface SocialPost {
  id: string;
  type: 'image' | 'video' | 'text' | 'link' | 'music' | 'task';
  content: string;
  associatedFestivalId?: string;
  associatedTaskId?: string;
  status: 'draft' | 'pending' | 'published';
  mediaUrl?: string;
  scheduledDate?: string;
  createdAt: string;
  createdBy: string;
  order?: number;
  color?: string;
}

// Plataforma de registro y postulación de festivales
export interface Platform {
  id: string;
  name: string;
  icon: string;
}

// Preferencias de notificación del usuario
export interface UserNotificationPreferences {
  preferredTime?: string;
  deadlines: {
    enabled: boolean;
    advanceDays: number;
    advanceDaysList?: number[];
  };
  newsDates: {
    enabled: boolean;
    advanceDays: number;
  };
  statusChanges: {
    enabled: boolean;
  };
  birthdayReminders: {
    enabled: boolean;
  };
  customReminders: {
    enabled: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: UserNotificationPreferences = {
  preferredTime: "09:00",
  deadlines: {
    enabled: true,
    advanceDays: 3,
    advanceDaysList: [3, 0],
  },
  newsDates: {
    enabled: true,
    advanceDays: 1,
  },
  statusChanges: {
    enabled: true,
  },
  birthdayReminders: {
    enabled: true,
  },
  customReminders: {
    enabled: true,
  },
  quietHours: {
    enabled: false,
    start: "22:00",
    end: "08:00",
  },
};

// Instituciones y organismos de fomento (Subcolección /projects/{projectId}/institutions)
export interface DistributionInstitution {
  id: string;
  nombre: string;
  emailContacto: string;
  responsable: string;
  notas?: string;
  fechaCreacion: string;
}

export type DistributionPlanStatus = 'borrador' | 'en_revision' | 'aprobado' | 'no_aprobado' | 'archivado' | 'pendiente';

export interface DistributionPlanStatusHistory {
  id: string;
  estadoAnterior: DistributionPlanStatus | null;
  estadoNuevo: DistributionPlanStatus;
  fechaHora: string;
  autor: string;
  notas?: string;
}

// Planes de distribución institucional (Subcolección /projects/{projectId}/distribution_plans)
export interface DistributionPlan {
  id: string;
  nombre: string;
  institucionId: string;
  institucionNombre: string;
  estado: DistributionPlanStatus;
  statusHistory: DistributionPlanStatusHistory[];
  festivalesIds: string[];
  festivalesBorrador?: Festival[];
  notas?: string;
  fechaCreacion: string;
  fechaResolucion?: string;
  presupuestoEstimado?: number;
}
```

### 2.2 Catálogo Exhaustivo de Colecciones y Subcolecciones en Firestore

| Ruta de Colección / Subcolección | Entidad / Documento | Campos y Tipos de Datos |
| :--- | :--- | :--- |
| `/projects/{projectId}` | `Project` | `id` (string), `name` (string), `iconUrl` (string), `fps` (number), `resolution` (string), `createdBy` (string email), `members` (array de objetos `ProjectMember`), `authorizedUsers` (array de strings en minúsculas), `theme` (objeto `ProjectThemeConfig`), `tags` (array de strings opcional), `description` (string opcional), `createdAt` (string ISO), `updatedAt` (string ISO). |
| `/projects/{projectId}/festivals/{festivalId}` | `Festival` | `id` (string), `name` (string), `country` (string), `type` (string), `status` (string FestivalStatus), `statusHistory` (array de `StatusHistoryEntry`), `deadline` (string YYYY-MM-DD), `newsDate` (string YYYY-MM-DD), `category` (string), `nomination` (string), `link` (string), `platform` (string), `price` (string), `fee` (number), `observations` (string), `projectionDate` (string), `projectionLocation` (string), `projectionLat` (number), `projectionLng` (number), `laurel` (string URL), `laurelBg` (string 'transparent' \| 'white' \| 'black'), `tasks` (array de `Task`), `createdBy` (string), `isPinned` (boolean), `pinNote` (string), `archived` (boolean), `isTestFestival` (boolean), `includeInStats` (boolean), `editionYear` (number), `editionNumber` (number), `previousEditionId` (string), `editionHistory` (array de objetos), `createdAt` (string ISO), `updatedAt` (string ISO), `isPreliminary` (boolean), `distributionPlanId` (string), `distributionPlanName` (string), `esBorradorPlan` (boolean), `institucionNombre` (string), `fechaAprobacionInstitucional` (string). |
| `/projects/{projectId}/distribution_plans/{planId}` | `DistributionPlan` | `id` (string), `nombre` (string), `institucionId` (string), `institucionNombre` (string), `estado` (string DistributionPlanStatus), `statusHistory` (array de `DistributionPlanStatusHistory`), `festivalesIds` (array de strings), `festivalesBorrador` (array de `Festival`), `notas` (string), `fechaCreacion` (string ISO), `fechaResolucion` (string ISO), `presupuestoEstimado` (number). |
| `/projects/{projectId}/institutions/{institutionId}` | `DistributionInstitution` | `id` (string), `nombre` (string), `emailContacto` (string), `responsable` (string), `notas` (string), `fechaCreacion` (string ISO). |
| `/projects/{projectId}/film_data/{filmDataId}` | `FilmData` | `id` (string), `lang` (string), `accentColor` (string), `logoUrl` (string URL), `posterUrl` (string URL), `bottomLogos` (array de strings URL), `history` (map con `logline` y `synopsis`), `techSpecs` (map de especificaciones técnicas), `biography` (string), `credits` (array de objetos rol/nombre/redes), `contactInfo` (array de grupos y líneas de contacto). |
| `/projects/{projectId}/gallery/{galleryId}` | `GalleryItem` | `id` (string), `url` (string URL Storage), `type` (string 'image' \| 'video'), `name` (string), `createdAt` (string ISO), `category` (string opcional). |
| `/projects/{projectId}/notes/{noteId}` | `AppNote` | `id` (string), `title` (string), `content` (string), `date` (string ISO), `author` (string), `color` (string opcional). |
| `/projects/{projectId}/reminders/{reminderId}` | `Reminder` | `id` (string), `title` (string), `date` (string YYYY-MM-DD), `time` (string HH:mm), `festivalId` (string opcional), `createdAt` (string ISO), `createdBy` (string). |
| `/projects/{projectId}/social_posts/{postId}` | `SocialPost` | `id` (string), `type` (string 'image' \| 'video' \| 'text' \| 'link' \| 'music' \| 'task'), `content` (string), `associatedFestivalId` (string), `associatedTaskId` (string), `status` (string 'draft' \| 'pending' \| 'published'), `mediaUrl` (string), `scheduledDate` (string), `createdAt` (string ISO), `createdBy` (string), `order` (number), `color` (string). |
| `/projects/{projectId}/bugs/{bugId}` | `BugTicket` | `id` (string), `title` (string), `description` (string), `status` (string 'open' \| 'in_progress' \| 'resolved'), `priority` (string 'low' \| 'medium' \| 'high'), `dateReported` (string ISO), `author` (string). |
| `/projects/{projectId}/roadmap/{roadmapId}` | `RoadmapItem` | `id` (string), `title` (string), `description` (string), `status` (string 'planned' \| 'in_progress' \| 'completed'), `quarter` (string ej: "Q3 2026"), `author` (string). |
| `/users/{userId}` | Perfil de Usuario | `activeSkin` (string), `lastLogin` (string ISO), `email` (string), `name` (string). |
| `/fcm_tokens/{userEmail}` | Tokens Push FCM | `tokens` (array de strings de registro FCM), `email` (string), `lastUpdated` (string ISO). |
| `/user_notif_prefs/{userEmail}` | Preferencias de Notificación | `preferences` (map `UserNotificationPreferences`), `updatedAt` (string ISO). |
| `/audit_logs/{logId}` | Registro Global de Auditoría | `id` (string), `action` (string), `details` (string), `timestamp` (string ISO), `userEmail` (string), `collection` (string). |
| `/system_settings/gemini_spark` | Configuración Gemini Spark | `enabled` (boolean), `apiKey` (string token de acceso), `updatedAt` (string ISO). |
| `/system_settings/gemini_spark_last_access` | Telemetría Spark | `timestamp` (string ISO), `query` (string), `festivalsCount` (number), `eventId` (string). |

---

## 3. ALMACENAMIENTO Y PROCESAMIENTO MULTIMEDIA (src/utils/storageHelpers.ts)

### 3.1 Arquitectura de Almacenamiento en Cloud Storage
Todas las operaciones de carga y eliminación de archivos multimedia se canalizan a través de `src/utils/storageHelpers.ts`, garantizando el aislamiento estricto de cada asset bajo el prefijo canónico `projects/{projectId}/` en el bucket oficial `gs://festis-bucket-a`.

### 3.2 Rutas de Almacenamiento
*   **Ícono / Isotipo de Obra**: `projects/{projectId}/icon/{timestamp}_{fileName}`
*   **Tema y Fondos del Proyecto**: `projects/{projectId}/theme/{timestamp}_{fileName}`
*   **Laureles Oficiales**: `projects/{projectId}/laureles/{timestamp}_{fileName}`
*   **Galería Multimedia**: `projects/{projectId}/gallery/{categoryId}/{timestamp}_{fileName}`
*   **Ficha Técnica (Presskit)**: `projects/{projectId}/film_data/{field}_{timestamp}`

### 3.3 Procesamiento y Compresión en el Cliente
El sistema impone procesamiento exclusivo del lado del cliente antes del envío a Firebase Storage para eliminar costos de cómputo en el servidor y latencia:
*   **Librería**: `browser-image-compression` (`v2.0.2`).
*   **Algoritmo y Parámetros Estándar**:
    *   `maxSizeMB`: `1` (el archivo de salida nunca superará 1 Megabyte).
    *   `maxWidthOrHeight`: `1280` píxeles.
    *   `useWebWorker`: `true` (el procesamiento gráfico se delega a un Web Worker sin congelar el hilo principal de la UI).
    *   `fileType`: `'image/webp'` (conversión obligatoria a formato WebP optimizado).
*   **Regla de Excepción para Pósters y Stills de Alta Fidelidad**:
    Si la ruta de destino incluye la subcadena `poster` o `stills` (`isPosterOrStill`), la compresión destructiva se omite automáticamente para preservar la resolución nativa y el perfil de color original de los fotogramas clave y pósters del film.
*   **Gestión de Progreso**:
    La función `uploadFileToStorage` utiliza `uploadBytesResumable`, notificando el progreso porcentual exacto (`(snapshot.bytesTransferred / snapshot.totalBytes) * 100`) a través de un callback `onProgress` que alimenta barras de carga dinámicas en la interfaz.
*   **Eliminación Atómica**:
    La función `deleteFileFromStorage(fileUrlOrPath)` instancia una referencia con `ref(storage, fileUrlOrPath)` y ejecuta `deleteObject()`, capturando de manera controlada errores por inexistencia previa o desincronización.

---

## 4. SINCRONIZACIÓN Y REACTIVIDAD CLIENTE

### 4.1 Hooks de Persistencia y Sincronización (`src/hooks/`)
*   **`useFirestoreSyncArray` (`src/hooks/useFirestoreSync.ts`)**:
    *   Gestiona suscripciones reactivas en tiempo real mediante `onSnapshot` a colecciones y subcolecciones de Firestore.
    *   **Resiliencia Offline y Modo Local**: Detecta si `localStorage.getItem('__localMode') === 'true'`. Si el modo local está activo, recupera y sincroniza automáticamente desde la clave `local_${path}`, escuchando eventos del canal `cardigan:sync-mode-change`.
    *   **Escrituras Atómicas**: Provee operaciones `add`, `update`, `remove` y `batchUpdate` utilizando `writeBatch` de Firestore para garantizar que no existan escrituras fragmentadas.
    *   **Saneamiento de Datos**: Aplica `removeUndefined(obj)` de forma recursiva antes de enviar cualquier documento a Firestore, evitando excepciones por campos `undefined`.
    *   **Telemetría de Lecturas**: Mide y contabiliza las operaciones mediante `trackFirestoreReads`, `trackFirestoreWrites` y `trackFirestoreDeletes`.
*   **`useFirestoreSyncDoc` (`src/hooks/useFirestoreSyncDoc.ts`)**:
    *   Sincroniza documentos individuales (ej: ficha técnica `FilmData`) con escucha reactiva vía `doc()` y `onSnapshot()`, manteniendo copia espejada en `localStorage`.
*   **`useLocalSyncArray` (`src/hooks/useLocalSyncArray.ts`)**:
    *   Abstracción de sincronización puramente local para datos temporales o preferencias no críticas en `localStorage`.
*   **`useNotificationEngine` (`src/hooks/useNotificationEngine.ts`)**:
    *   Motor reactivo de notificaciones ejecutado en el cliente.
    *   Monitorea la lista de festivales activos y calcula en tiempo real:
        *   **Cierres de Inscripción (Deadlines)**: Alertas a los 3 días y el mismo día de cierre (0 días).
        *   **Notificaciones de Selección (News Dates)**: Alertas a 1 día del anuncio y el día exacto de resultados.
        *   **Proyecciones Oficiales**: Avisos a 7 días y el día de la función.
    *   Dispara banners flotantes locales y gestiona la suscripción al Service Worker de FCM mediante `getToken()`.

### 4.2 Jerarquía de Contextos (Context Tree)
1.  **`AuthProvider` (`src/AuthProvider.tsx`)**:
    *   Envuelve la raíz de la aplicación.
    *   Mantiene el estado reactivo del usuario (`User | null`), token de acceso Google OAuth, errores y registros de depuración.
    *   Implementa caché optimista instantánea leyendo de `cached_firebase_user`, permitiendo que la interfaz monte de inmediato sin bloquearse por la resolución asíncrona de `onAuthStateChanged`.
2.  **`ProjectContext` (`src/context/ProjectContext.tsx`)**:
    *   Escucha en tiempo real la colección `/projects`.
    *   Filtra automáticamente los proyectos según pertenencia: los usuarios administradores (`axeldibarra@gmail.com`, `luciaruocco1313@gmail.com`) obtienen acceso a todas las obras; los usuarios estándar consultan mediante `where('authorizedUsers', 'array-contains', userEmail)`.
    *   Mantiene en estado el proyecto activo (`currentProject`), persistiendo su ID en `localStorage.getItem('festis_active_project_id')`.
    *   Expone las funciones `createProject`, `updateProject` y `deleteProject`.
3.  **`SkinContext` (`src/context/SkinContext.tsx`)**:
    *   Controla los temas visuales del sistema (`cardigan`, `cardigan-noche`, `cardigan-boceto`).
    *   Aplica dinámicamente el atributo HTML `data-skin` y la clase `.dark` sobre `document.documentElement` y `document.body`.
    *   Persiste la selección en `localStorage.getItem('festis_active_skin')` y actualiza automáticamente el documento del usuario en `/users/{uid}` en Firestore.

### 4.3 Service Worker y Splash Screen (`index.html`)
*   **Service Worker (`/sw.js`)**: Registrado en el evento `load` de la ventana (`navigator.serviceWorker.register('/sw.js')`). Provee capacidades PWA, control de caché offline y manejo de eventos `push` en segundo plano.
*   **Splash Screen Nativo**:
    *   Inyectado directamente en el HTML estático (`#splash-screen`) dentro de `#root` para renderizado instantáneo a 0ms de carga.
    *   Diseñado con tarjeta translúcida `backdrop-filter: blur(12px)`, spinner con gradiente animado CSS `splashGradientAnim` y tipografía nativa del sistema operativo.
    *   Incluye botón de reintento manual que se activa tras un temporizador de seguridad de 8 segundos si la conexión experimenta degradación.
    *   Desmontado con animación suave de desvanecimiento por React al completar la carga de dependencias.

---

## 5. RUTAS Y LÓGICA DE SERVIDOR (server.ts)

El servidor Express implementa los siguientes endpoints oficiales:

### 5.1 Endpoints de Sistema y Autenticación
*   `GET /api/health`: Healthcheck básico del contenedor. Devuelve `{ status: "ok" }`.
*   `POST /api/send-2fa-recovery-code`: Despacha un código de recuperación 2FA de 6 dígitos.
    *   *Body*: `{ email: string, phone?: string, code: string }`.
    *   *Respuesta*: `{ success: true, message: string, details: object }`.
    *   *Acción*: Registra el evento en `/audit_logs` y envía notificación push FCM de emergencia si el usuario cuenta con tokens activos.

### 5.2 Endpoints de Notificaciones y Push FCM
*   `POST /api/save-fcm-token`: Registra un token de notificación push web.
    *   *Body*: `{ email: string, token: string }`.
    *   *Acción*: Guarda el token en `/fcm_tokens/{email}` agregándolo mediante `FieldValue.arrayUnion(token)`.
*   `POST /api/test-push`: Envía una notificación push de diagnóstico al usuario.
    *   *Body*: `{ email: string }`.
*   `POST /api/notify-bug`: Despacha alerta push a los administradores y desarrolladores cuando se reporta un ticket en el bug tracker.
    *   *Body*: `{ title: string, description: string, author?: string }`.
*   `POST /api/trigger-cron`: Ejecuta manualmente la rutina de cron sin esperar la hora en punto.

### 5.3 Endpoints de Procesamiento e Inteligencia Artificial
*   `POST /api/parse-festival`: Analiza texto, enlaces web o capturas/archivos para extraer datos de festivales.
    *   *Body*: `{ textOrUrl?: string, fileBase64?: string, mimeType?: string, fileName?: string }`.
    *   *Lógica*:
        *   Si se provee un enlace web (`http/https`), descarga el contenido HTML mediante `fetch` (con User-Agent de navegador), extrae el texto plano hasta 15,000 caracteres con Cheerio y descarta protecciones Cloudflare.
        *   Si se adjunta un archivo en Base64, intenta procesarlo con Hugging Face (`Llama-3.2-11B-Vision-Instruct` / `Qwen2-VL-7B-Instruct`) o con el SDK de Google GenAI (`gemini-2.5-flash`).
        *   Si es texto puro, utiliza Groq SDK (`llama-3.3-70b-versatile`) con modo `json_object` devolviendo el esquema canónico de `Festival`.
*   `POST /api/crawl-proposals`: Endpoint reservado para spiders de convocatorias automáticas.

### 5.4 Endpoints de Integración Gemini Spark y Gems
*   `GET /api/spark/openapi.json`: Especificación OpenAPI 3.0 formal que describe la API de lectura de Festis para que agentes y Gems de Gemini puedan consumir el catálogo de festivales.
*   `GET /api/spark/markdown`, `/api/spark/festivals.md`, `/api/spark/summary.txt`: Devuelve la lista completa de festivales formateada como un documento Markdown estructurado y sintetizado, apto para lectura de agentes de IA. Valida clave mediante encabezado `x-spark-api-key` o parámetro de consulta `key`.
*   `ALL /api/spark/festivals`, `/api/spark/data`: Devuelve el catálogo estructurado de festivales en formato JSON plano con capacidad de filtrado por estado (`?status=SELECCIONADO`).
*   `ALL /api/gemini-spark/read`, `/api/spark/read`: Endpoint de consulta en lenguaje natural asistido por IA.
    *   *Parámetros*: `query` (string) y `key` (string).
    *   *Lógica*: Carga los festivales de la base de datos en modo solo lectura, arma el prompt de contexto y genera una respuesta conversacional fluida en español mediante el modelo `gemini-2.5-flash` del SDK `@google/genai`.
*   `GET /api/gemini-spark/status`: Informa el estado de disponibilidad del servicio Spark, indicando si está habilitado y si requiere autenticación.

### 5.5 Proxies Multimedia
*   `POST /api/proxy-image`: Recibe una URL externa en `{ url: string }` y devuelve una cadena Data URL en Base64 (`data:image/...;base64,...`) para permitir el procesamiento de imágenes cruzadas en Canvas HTML5 sin violaciones de CORS.
*   `GET /api/proxy-rom`: Descarga y retransmite binarios y assets externos aplicando encabezados `Access-Control-Allow-Origin: *` y streaming con `Readable.fromWeb()`.

### 5.6 Tareas Programadas (node-cron)
*   **Planificación**: Se ejecuta cada 60 minutos en el minuto cero (`cron.schedule('0 * * * *')`).
*   **Mecánica de Evaluación**:
    1.  Carga las preferencias de todos los usuarios desde `/user_notif_prefs`.
    2.  Comprueba si la hora local del servidor coincide con la hora preferida configurada por el usuario (`preferredTime`, por defecto `09:00`).
    3.  Recupera los tokens activos desde `/fcm_tokens`.
    4.  Analiza la lista de festivales evaluando diferencias en días (`diffDays`):
        *   **Cierres**: Notifica a 3 días y a 0 días de la fecha límite.
        *   **Resultados de Selección**: Notifica a 1 día y a 0 días del anuncio.
        *   **Proyecciones**: Notifica a 7 días y a 0 días de la función.
    5.  Despacha los lotes WebPush mediante `sendPushNotifications`.
    6.  Si Firebase Cloud Messaging responde con errores `messaging/invalid-registration-token` o `messaging/registration-token-not-registered`, el servidor ejecuta una rutina automática de depuración que elimina los tokens caducados del documento del usuario en Firestore.

---

## 6. ESPECIFICACIÓN MULTI-TENANT Y VISTA DE INICIO

### 6.1 Modelo Jerárquico de Obra Audiovisual
Festis aísla por completo los datos operativos de cada película, cortometraje o serie. La entidad `Project` representa la obra matriz.

```
/projects/{projectId} (Documento de la Obra)
  ├── /festivals/{festivalId}
  ├── /distribution_plans/{planId}
  ├── /institutions/{institutionId}
  ├── /film_data/{filmDataId}
  ├── /gallery/{galleryId}
  ├── /notes/{noteId}
  ├── /reminders/{reminderId}
  ├── /social_posts/{postId}
  ├── /bugs/{bugId}
  └── /roadmap/{roadmapId}
```

### 6.2 Reglas de Seguridad en Firestore (`festis-db-a`)
El acceso a cualquier subcolección está supeditado a la función de seguridad:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isProjectAuthorized(projectId) {
      let projectData = get(/databases/$(database)/documents/projects/$(projectId)).data;
      return isAuthenticated() && (
        (request.auth.token.email != null && (
          projectData.createdBy == request.auth.token.email ||
          projectData.authorizedUsers.hasAny([request.auth.token.email])
        )) ||
        (request.auth.uid != null && projectData.ownerId == request.auth.uid) ||
        (request.auth.token.email == 'axeldibarra@gmail.com')
      );
    }

    match /projects/{projectId} {
      allow read: if isAuthenticated() && (
        (request.auth.token.email != null && (
          resource.data.createdBy == request.auth.token.email ||
          resource.data.authorizedUsers.hasAny([request.auth.token.email])
        )) ||
        (request.auth.uid != null && resource.data.ownerId == request.auth.uid) ||
        (request.auth.token.email == 'axeldibarra@gmail.com')
      );
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (
        (request.auth.token.email != null && (
          resource.data.createdBy == request.auth.token.email ||
          resource.data.authorizedUsers.hasAny([request.auth.token.email])
        )) ||
        (request.auth.uid != null && resource.data.ownerId == request.auth.uid) ||
        (request.auth.token.email == 'axeldibarra@gmail.com')
      );

      match /{subcollection=**} {
        allow read, write: if isProjectAuthorized(projectId);
      }
    }

    // Reglas de colecciones globales (usuarios, tokens, auditoría)
    match /users/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    match /fcm_tokens/{email} {
      allow read, write: if isAuthenticated();
    }
    match /user_notif_prefs/{email} {
      allow read, write: if isAuthenticated();
    }
    match /audit_logs/{logId} {
      allow read, create: if isAuthenticated();
    }
    match /system_settings/{settingId} {
      allow read: if true;
      allow write: if isAuthenticated() && request.auth.token.email == 'axeldibarra@gmail.com';
    }
  }
}
```

### 6.3 Especificación de la Vista de Inicio (`ProjectsHomeView`)
Cuando no existe un proyecto activo (`currentProject === null`), la aplicación monta exclusivamente el componente `ProjectsHomeView`, el cual implementa las siguientes reglas funcionales y de interfaz:

1.  **App Header Exclusivo y Sticky**:
    *   Fijado en la parte superior (`sticky top-0 z-40`) con fondo de desenfoque `bg-white/90 backdrop-blur-xl`. Permanece visible de forma continua durante el desplazamiento del catálogo de obras.
    *   **Botón de Menú**: Abre el panel lateral reducido (sidebar drawer).
    *   **Identidad Visual**: Logotipo e isotipo de Festis.
    *   **Buscador Transversal en Tiempo Real**: Input centrado que filtra simultáneamente por:
        *   Título de la obra audiovisual (`project.name`).
        *   Resolución técnica de entrega (`project.resolution`, ej: `1080p`, `4K`).
        *   Etiquetas temáticas y tags de producción (`project.tags`, ej: `Ficción`, `Animación`, `Drama`).
    *   **Indicador de Obras**: Contador en tiempo real de proyectos disponibles para el usuario.
2.  **Sidebar Reducida y Exclusiva**:
    *   No contiene accesos a festivales, calendarios ni estadísticas (dado que estos pertenecen a una obra activa).
    *   Contiene únicamente tres elementos:
        1.  *Configuración de la App* (`onOpenConfig`): Ajustes globales y apariencia del sistema.
        2.  *Ayuda* (`onOpenHelp`): Documentación y soporte.
        3.  *Cerrar Sesión* (`LogoutConfirmModal`): Ubicado en la parte inferior, con modal de confirmación y cuenta regresiva de 5 segundos antes de invalidar la sesión.
3.  **Aislamiento Estricto de la Creación de Festivales**:
    *   Queda totalmente suprimido el botón flotante unificado de agregar festival (FAB), así como el App Header de obra y la barra de navegación inferior (Bottom Bar).
    *   Los festivales no pueden existir de manera huérfana en el sistema; su creación únicamente se permite cuando el usuario ingresa a una obra del catálogo.
4.  **Tarjeta de Proyecto (`ProjectCard`)**:
    *   Muestra el isotipo o iniciales con el color dominante de la obra (`project.theme.colorDominante`).
    *   Insignias técnicas: Cuadros por segundo (`fps`) y resolución (`resolution`).
    *   Lista de etiquetas (`tags`) con icono representativo.
    *   Contador reactivo de festivales en tiempo real obtenido mediante suscripción `onSnapshot` a la subcolección `projects/{projectId}/festivals`.
    *   Al hacer clic, ejecuta `setCurrentProject(project)`, dando paso al entorno de trabajo específico de esa obra audiovisual.
