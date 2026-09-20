/**
 * Definiciones de tipos, modelos e interfaces para Festis Multi-Tenant.
 * Plataforma modular desacoplada de proyectos previos y basada en obras audiovisuales independientes.
 */

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
