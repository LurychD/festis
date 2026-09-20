import { useEffect } from 'react';
import { differenceInDays } from 'date-fns';
import { Festival, FestivalStatus, Reminder, Notification } from '../types';
import { parseFestivalDate, formatDisplayDate } from '../utils/helpers';

interface UseNotificationEngineProps {
  festivals: Festival[];
  reminders: Reminder[];
  addNotification: (
    type: Notification['type'],
    title: string,
    message: string,
    icon?: string,
    festivalId?: string
  ) => void;
}

/**
 * Hook personalizado para escanear periódicamente los festivales y recordatorios,
 * generando notificaciones automáticas y alertas nativas de escritorio.
 * Incluye además una rutina de limpieza periódica de claves antiguas en localStorage.
 */
export function useNotificationEngine({
  festivals,
  reminders,
  addNotification
}: UseNotificationEngineProps) {

  // Rutina de limpieza automática de claves de notificaciones pasadas en localStorage
  useEffect(() => {
    try {
      const todayKey = new Date().toISOString().split('T')[0];
      const keysToClean: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('notif_dl_') || key.startsWith('notif_news_') || key.startsWith('notif_task_'))) {
          // Si la clave no pertenece al día de hoy ni es reciente, se marca para borrar
          if (!key.endsWith(`_${todayKey}`)) {
            keysToClean.push(key);
          }
        }
      }

      keysToClean.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Error purgando claves antiguas de notificación en localStorage:', e);
    }
  }, []);

  // Motor automatizado de verificación de alertas y notificaciones
  useEffect(() => {
    if (!festivals || festivals.length === 0) return;

    const checkAutomatedNotifications = () => {
      const todayKey = new Date().toISOString().split('T')[0];
      const now = new Date();

      festivals.forEach((f) => {
        if (f.archived) return;

        // 1. Verificación de Fechas Límite (Deadlines) - Solo para pendientes de envío (POR_ENVIAR / PROXIMAMENTE)
        if (
          f.deadline &&
          (f.status === FestivalStatus.POR_ENVIAR || f.status === FestivalStatus.PROXIMAMENTE)
        ) {
          const dDate = parseFestivalDate(f.deadline);
          if (dDate) {
            const daysLeft = differenceInDays(dDate, now);
            const dedupKey = `notif_dl_${f.id}_${todayKey}`;

            if (!localStorage.getItem(dedupKey)) {
              if (daysLeft === 0) {
                addNotification(
                  'warning',
                  `⏰ ¡HOY vence ${f.name}!`,
                  `La fecha límite del festival ${f.name} es hoy. Revisa el envío urgente.`,
                  undefined,
                  f.id
                );
                localStorage.setItem(dedupKey, 'true');
              } else if (daysLeft > 0 && daysLeft <= 3) {
                addNotification(
                  'warning',
                  `⏳ Vence en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}: ${f.name}`,
                  `El festival ${f.name} vence el ${f.deadline}. Quedan ${daysLeft} días.`,
                  undefined,
                  f.id
                );
                localStorage.setItem(dedupKey, 'true');
              }
            }
          }
        }

        // 2. Verificación de Fechas de Noticia / Resultados (newsDate) - Solo para festivales en evaluación (EN_REVISION / PROYECTADO)
        if (
          f.newsDate &&
          (f.status === FestivalStatus.EN_REVISION || f.status === FestivalStatus.PROYECTADO)
        ) {
          const nDate = parseFestivalDate(f.newsDate);
          if (nDate) {
            const daysLeft = differenceInDays(nDate, now);
            const dedupKey = `notif_news_${f.id}_${todayKey}`;

            if (!localStorage.getItem(dedupKey)) {
              if (daysLeft === 0) {
                addNotification(
                  'info',
                  `📢 ¡HOY anuncian selección en ${f.name}!`,
                  `Se aguardan noticias de selección para el festival ${f.name}.`,
                  undefined,
                  f.id
                );
                localStorage.setItem(dedupKey, 'true');
              } else if (daysLeft > 0 && daysLeft <= 2) {
                addNotification(
                  'info',
                  `🔔 Resultados próximos en ${f.name}`,
                  `En ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'} (${f.newsDate}) se anuncian los seleccionados.`,
                  undefined,
                  f.id
                );
                localStorage.setItem(dedupKey, 'true');
              }
            }
          }
        }

        // 3. Verificación de Tareas Pendientes con Fecha Límite - Solo festivales activos
        if (
          f.tasks &&
          f.tasks.length > 0 &&
          f.status !== FestivalStatus.CERRADO &&
          f.status !== FestivalStatus.NO_SELECCIONADO &&
          f.status !== FestivalStatus.DESCALIFICADO
        ) {
          f.tasks.forEach((task) => {
            if (!task.completed && task.dueDate) {
              const tDate = parseFestivalDate(task.dueDate);
              if (tDate) {
                const daysLeft = differenceInDays(tDate, now);
                const taskKey = `notif_task_${f.id}_${task.id}_${todayKey}`;

                if (daysLeft <= 0 && !localStorage.getItem(taskKey)) {
                  addNotification(
                    'warning',
                    `📌 Tarea pendiente: ${task.title}`,
                    `Festival: ${f.name}. Fecha límite: ${task.dueDate}.`,
                    undefined,
                    f.id
                  );
                  localStorage.setItem(taskKey, 'true');
                }
              }
            }
          });
        }
      });

      // 4. Verificación de Recordatorios Personalizados (reminders)
      if (reminders && reminders.length > 0) {
        reminders.forEach((r) => {
          if (r.date) {
            const rDate = new Date(r.date);
            if (!isNaN(rDate.getTime()) && rDate <= now) {
              const remKey = `notif_rem_${r.id}`;
              if (!localStorage.getItem(remKey)) {
                addNotification(
                  'info',
                  `🔔 Recordatorio: ${r.title}`,
                  `Tienes un recordatorio agendado para ${formatDisplayDate(r.date)}.`
                );
                localStorage.setItem(remKey, 'true');
              }
            }
          }
        });
      }
    };

    // Ejecutar verificación inicial y cada 2 minutos
    checkAutomatedNotifications();
    const interval = setInterval(checkAutomatedNotifications, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [festivals, reminders, addNotification]);
}
