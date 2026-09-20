import { Festival, Reminder, AppMember, AuditLog } from '../types';

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedData?: any;
  summary?: {
    festivalsCount: number;
    remindersCount: number;
    hasFilmData: boolean;
    modulesDetected: string[];
  };
}

/**
 * Validador de esquemas para backups JSON de Festis.
 * Previene la importación de archivos corruptos o maliciosos.
 */
export function validateBackupJSON(jsonInput: any): BackupValidationResult {
  if (!jsonInput || typeof jsonInput !== 'object') {
    return {
      isValid: false,
      error: 'El archivo subido no contiene un formato JSON válido u objeto.',
    };
  }

  // Caso 1: Array directo de Festivales
  if (Array.isArray(jsonInput)) {
    if (jsonInput.length === 0) {
      return {
        isValid: false,
        error: 'El archivo contiene una lista vacía de festivales.',
      };
    }

    const validFestivals: Festival[] = [];
    for (let i = 0; i < jsonInput.length; i++) {
      const item = jsonInput[i];
      if (!item || typeof item !== 'object' || !item.id || !item.name) {
        return {
          isValid: false,
          error: `Elemento #${i + 1} no cumple el esquema mínimo de festival (requiere 'id' y 'name').`,
        };
      }
      validFestivals.push({
        id: String(item.id),
        name: String(item.name),
        status: item.status || 'Por Enviar',
        country: item.country || '',
        city: item.city || '',
        deadline: item.deadline || '',
        fee: typeof item.fee === 'number' ? item.fee : Number(item.fee) || 0,
        currency: item.currency || 'USD',
        submissionPlatform: item.submissionPlatform || '',
        tasks: Array.isArray(item.tasks) ? item.tasks : [],
        ...item,
      });
    }

    return {
      isValid: true,
      sanitizedData: validFestivals,
      summary: {
        festivalsCount: validFestivals.length,
        remindersCount: 0,
        hasFilmData: false,
        modulesDetected: ['festivales'],
      },
    };
  }

  // Caso 2: Objeto Estructurado de Backup (Versión 1 o Versión 2)
  const modulesDetected: string[] = [];
  let festivalsCount = 0;
  let remindersCount = 0;
  let hasFilmData = false;

  const sanitized: any = {};

  // Validar versión o marca de agua
  if (jsonInput.version || jsonInput.festivals || jsonInput.members) {
    if (jsonInput.version) {
      sanitized.version = jsonInput.version;
    }

    if (jsonInput.festivals) {
      if (!Array.isArray(jsonInput.festivals)) {
        return { isValid: false, error: 'El campo "festivals" debe ser una lista/array.' };
      }
      sanitized.festivals = jsonInput.festivals.filter(
        (f: any) => f && typeof f === 'object' && f.id && f.name
      );
      festivalsCount = sanitized.festivals.length;
      modulesDetected.push(`festivales (${festivalsCount})`);
    }

    if (jsonInput.reminders) {
      if (!Array.isArray(jsonInput.reminders)) {
        return { isValid: false, error: 'El campo "reminders" debe ser una lista/array.' };
      }
      sanitized.reminders = jsonInput.reminders.filter((r: any) => r && typeof r === 'object' && r.id && r.title);
      remindersCount = sanitized.reminders.length;
      modulesDetected.push(`recordatorios (${remindersCount})`);
    }

    if (jsonInput.members && Array.isArray(jsonInput.members)) {
      sanitized.members = jsonInput.members;
      modulesDetected.push('miembros');
    }

    if (jsonInput.filmData && typeof jsonInput.filmData === 'object') {
      sanitized.filmData = jsonInput.filmData;
      hasFilmData = true;
      modulesDetected.push('ficha técnica');
    }

    if (jsonInput.notes && Array.isArray(jsonInput.notes)) {
      sanitized.notes = jsonInput.notes;
      modulesDetected.push('notas de producción');
    }

    if (jsonInput.bugs && Array.isArray(jsonInput.bugs)) {
      sanitized.bugs = jsonInput.bugs;
      modulesDetected.push('reportes de errores');
    }

    if (jsonInput.roadmap && Array.isArray(jsonInput.roadmap)) {
      sanitized.roadmap = jsonInput.roadmap;
      modulesDetected.push('hoja de ruta');
    }

    if (jsonInput.auditLogs && Array.isArray(jsonInput.auditLogs)) {
      sanitized.auditLogs = jsonInput.auditLogs;
      modulesDetected.push('historial de auditoría');
    }

    if (jsonInput.notifications && Array.isArray(jsonInput.notifications)) {
      sanitized.notifications = jsonInput.notifications;
      modulesDetected.push('notificaciones');
    }

    if ((jsonInput.socialPosts || jsonInput.social_posts) && Array.isArray(jsonInput.socialPosts || jsonInput.social_posts)) {
      sanitized.socialPosts = jsonInput.socialPosts || jsonInput.social_posts;
      modulesDetected.push('redes sociales');
    }

    if (jsonInput.gallery && Array.isArray(jsonInput.gallery)) {
      sanitized.gallery = jsonInput.gallery;
      modulesDetected.push('galería');
    }

    // Planes de distribución y sus borradores asociados
    if ((jsonInput.distributionPlans || jsonInput.distribution_plans) && Array.isArray(jsonInput.distributionPlans || jsonInput.distribution_plans)) {
      const rawPlans = jsonInput.distributionPlans || jsonInput.distribution_plans;
      sanitized.distributionPlans = rawPlans.filter(
        (p: any) => p && typeof p === 'object' && p.id && p.nombre
      );
      modulesDetected.push(`planes de distribución (${sanitized.distributionPlans.length})`);
    }

    // Instituciones y organismos reguladores
    if ((jsonInput.institutions || jsonInput.institutions_Cardigan) && Array.isArray(jsonInput.institutions || jsonInput.institutions_Cardigan)) {
      const rawInst = jsonInput.institutions || jsonInput.institutions_Cardigan;
      sanitized.institutions = rawInst.filter(
        (inst: any) => inst && typeof inst === 'object' && inst.id && inst.nombre
      );
      modulesDetected.push(`instituciones (${sanitized.institutions.length})`);
    }

    // Plataformas de postulación
    if (jsonInput.platforms && Array.isArray(jsonInput.platforms)) {
      sanitized.platforms = jsonInput.platforms.filter(
        (pl: any) => pl && typeof pl === 'object' && pl.id && pl.name
      );
      modulesDetected.push(`plataformas (${sanitized.platforms.length})`);
    }

    if (modulesDetected.length === 0) {
      return {
        isValid: false,
        error: 'El objeto JSON no contiene ninguna sección de datos reconocida para la aplicación.',
      };
    }

    return {
      isValid: true,
      sanitizedData: sanitized,
      summary: {
        festivalsCount,
        remindersCount,
        hasFilmData,
        modulesDetected,
      },
    };
  }

  return {
    isValid: false,
    error: 'Formato de copia de seguridad no reconocido. Verifique la estructura del archivo JSON.',
  };
}
