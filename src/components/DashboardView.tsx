import React from 'react';
import { isAfter, format } from 'date-fns';
import { parseFestivalDate, formatDisplayDate, cn, getStatusColorStyles } from '../utils/helpers';
import { auth } from '../firebase';
import { Festival, FestivalStatus, Task } from '../types';
import { FileText, CheckCircle2, X, Bell, ChevronRight, Hourglass, Projector, Megaphone, ListTodo, Pin, Clock } from 'lucide-react';
import { getStatusIcon } from '../utils/helpers';
import { TodaysAgendaList } from './dashboard/TodaysAgendaList';
import { PinnedFestivalsList } from './dashboard/PinnedFestivalsList';
import { UpcomingDeadlinesList } from './dashboard/UpcomingDeadlinesList';
import { AutoClosedFestivalsList } from './dashboard/AutoClosedFestivalsList';

const getRelevantDateForPinned = (f: Festival) => {
  const now = new Date();
  
  if (f.deadline) {
    const d = parseFestivalDate(f.deadline);
    if (d && isAfter(d, now)) return { label: 'Cierra', date: f.deadline };
  }
  
  if (f.newsDate) {
    const n = parseFestivalDate(f.newsDate);
    if (n && isAfter(n, now)) return { label: 'Notifica', date: f.newsDate };
  }
  
  if (f.projectionDate) {
    return { label: 'Proyecta', date: f.projectionDate };
  }
  
  if (f.newsDate) {
    return { label: 'Notificó', date: f.newsDate };
  }

  if (f.deadline) {
    return { label: 'Cerró', date: f.deadline };
  }

  return null;
}

interface DashboardViewProps {
  notifications: any[];
  reminders: any[];
  festivals: Festival[];
  isExcelModalOpen: boolean;
  setIsExcelModalOpen: (v: boolean) => void;
  excelImportStats: { imported: number, updated?: number, total: number } | null;
  isPdfModalOpen: boolean;
  setIsPdfModalOpen: (v: boolean) => void;
  handleExportPDF: (options?: any) => void;
  setSelectedFestival: (f: Festival) => void;
  setView: (v: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  notifications,
  reminders,
  festivals,
  isExcelModalOpen, setIsExcelModalOpen, excelImportStats,
  isPdfModalOpen, setIsPdfModalOpen, handleExportPDF,
  setSelectedFestival, setView
}) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const isToday = (dateStr?: string) => {
     if (!dateStr) return false;
     const d = parseFestivalDate(dateStr);
     if (!d || isNaN(d.getTime())) return false;
     return d.getTime() >= todayStart.getTime() && d.getTime() <= todayEnd.getTime();
  };

  const isWithinNext3Days = (dateStr?: string) => {
     if (!dateStr) return false;
     const d = parseFestivalDate(dateStr);
     if (!d || isNaN(d.getTime())) return false;
     const threeDaysFromNow = new Date();
     threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
     threeDaysFromNow.setHours(23, 59, 59, 999);
     return d.getTime() >= todayStart.getTime() && d.getTime() <= threeDaysFromNow.getTime();
  };

  interface AgendaItem {
    id: string;
    type: 'cierre' | 'proyeccion' | 'notificacion' | 'tarea' | 'recordatorio';
    festival?: Festival;
    task?: Task;
    recordatorio?: any;
  }

  const todaysAgenda: AgendaItem[] = [];
  festivals.forEach(f => {
     const isClosed = f.status === FestivalStatus.CERRADO || (f.status as string) === 'Cerrado';
     const closedToday = isClosed && (
       isToday(f.deadline) || 
       f.statusHistory?.some(h => 
         h.status === FestivalStatus.CERRADO && 
         !h.updatedBy?.includes("Cierre Automático") && 
         isToday(h.timestamp)
       )
     );

     if (closedToday) {
        todaysAgenda.push({ id: `cerrado-${f.id}`, type: 'cierre', festival: f });
     } else if (!isClosed && isToday(f.deadline)) {
        todaysAgenda.push({ id: `cierre-${f.id}`, type: 'cierre', festival: f });
     }

     if (isToday(f.projectionDate)) todaysAgenda.push({ id: `proyeccion-${f.id}`, type: 'proyeccion', festival: f });
     if (isToday(f.newsDate)) todaysAgenda.push({ id: `notificacion-${f.id}`, type: 'notificacion', festival: f });
     if (f.tasks) {
        f.tasks.forEach((t, tIdx) => {
           if (isWithinNext3Days(t.dueDate) && !t.completed) {
              todaysAgenda.push({ id: `tarea-${f.id}-${t.id || tIdx}`, type: 'tarea', festival: f, task: t });
           }
        });
     }
  });

  reminders.forEach((r, i) => {
    const isTodayReminder = isToday(r.date);
    
    // Check if tomorrow
    let isTomorrowReminder = false;
    if (r.date) {
       const d = parseFestivalDate(r.date);
       if (d && !isNaN(d.getTime())) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0,0,0,0);
          const tomoEnd = new Date(tomorrow);
          tomoEnd.setHours(23,59,59,999);
          if (d.getTime() >= tomorrow.getTime() && d.getTime() <= tomoEnd.getTime()) {
             isTomorrowReminder = true;
          }
       }
    }

    if (isTodayReminder || isTomorrowReminder) {
      todaysAgenda.push({ 
        id: `reminder-${r.id}-${i}`, 
        type: 'recordatorio', 
        festival: r.festivalId ? festivals.find(f => f.id === r.festivalId) : undefined,
        recordatorio: Object.assign({}, r, { title: isTomorrowReminder ? `[Mañana] ${r.title}` : r.title, message: r.time ? `A las ${r.time}` : '' }) 
      });
    }
  });

  // Ordenar la agenda: primero lo no enviado / pendiente, luego lo ya enviado, ordenado por prioridad de tipo
  const isFestivalSubmitted = (f?: Festival) => {
    if (!f) return false;
    return f.status !== FestivalStatus.POR_ENVIAR && f.status !== FestivalStatus.PROXIMAMENTE && f.status !== FestivalStatus.EN_DUDA;
  };

  todaysAgenda.sort((a, b) => {
    const aSub = isFestivalSubmitted(a.festival);
    const bSub = isFestivalSubmitted(b.festival);

    if (!aSub && bSub) return -1;
    if (aSub && !bSub) return 1;

    const typePriority: Record<string, number> = { cierre: 1, tarea: 2, proyeccion: 3, notificacion: 4, recordatorio: 5 };
    return (typePriority[a.type] || 9) - (typePriority[b.type] || 9);
  });

  const userName = auth.currentUser?.displayName?.split(' ')[0] || auth.currentUser?.email?.split('@')[0] || 'usuario';

  const upcomingDeadlines = festivals
    .filter(f => f.deadline && f.status === FestivalStatus.POR_ENVIAR)
    .filter(f => {
      const d = parseFestivalDate(f.deadline!);
      return d && d.getTime() >= todayStart.getTime();
    })
    .sort((a, b) => {
      const da = parseFestivalDate(a.deadline!);
      const db = parseFestivalDate(b.deadline!);
      if (!da || !db) return 0;
      return da.getTime() - db.getTime();
    })
    .slice(0, 30);

  const pinnedFestivals = festivals.filter(f => f.isPinned);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const closedFestivals = festivals
    .filter(f => {
      const isClosed = f.status === FestivalStatus.CERRADO || (f.status as string) === 'Cerrado';
      if (!isClosed) return false;

      const deadlineTime = f.deadline ? (parseFestivalDate(f.deadline)?.getTime() || 0) : 0;
      const closedHistoryTime = f.statusHistory?.length
        ? Math.max(
            ...f.statusHistory
              .filter(h => h.status === FestivalStatus.CERRADO && !h.updatedBy?.includes("Cierre Automático"))
              .map(h => parseFestivalDate(h.timestamp)?.getTime() || 0),
            0
          )
        : 0;

      const refTime = Math.max(deadlineTime, closedHistoryTime);
      return refTime >= sevenDaysAgo.getTime() && refTime <= Date.now();
    })
    .sort((a, b) => {
      const da = a.deadline ? (parseFestivalDate(a.deadline)?.getTime() || 0) : 0;
      const db = b.deadline ? (parseFestivalDate(b.deadline)?.getTime() || 0) : 0;
      return db - da;
    });

  return (
    <div className="space-y-6 mt-4 pb-16">
      {isExcelModalOpen && (
         <div className="fixed inset-0 bg-[#e91e63]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center">
               {!excelImportStats ? (
                  <>
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                     <h3 className="font-bold text-lg text-slate-800">Importando datos...</h3>
                     <p className="text-slate-500 text-sm mt-2 text-center">Analizando archivo e importando.</p>
                  </>
               ) : (
                  <>
                     <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                     </div>
                     <h3 className="font-bold text-lg text-slate-800">¡Importación Completa!</h3>
                     <p className="text-slate-500 text-sm mt-2 text-center">Se importaron {excelImportStats.imported} festivales nuevos.</p>
                     {(excelImportStats.updated ?? 0) > 0 && (
                        <p className="text-amber-500 text-sm mt-1 text-center font-medium">Se actualizaron {excelImportStats.updated} festivales existentes.</p>
                     )}
                     <button id="btn-auto-5" onClick={() => setIsExcelModalOpen(false)} className="mt-6 w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200">Entendido</button>
                  </>
               )}
            </div>
         </div>
      )}

      {/* Agenda de hoy */}
      <div className="space-y-4">
        <TodaysAgendaList 
          agendaItems={todaysAgenda} 
          userName={userName} 
          onSelectFestival={(f) => { setSelectedFestival(f); setView('details'); }}
          setView={setView}
        />
        
        {/* Se quitó el asitente IA y se movió a ProposalsView */}
      </div>

      {/* Pinned Festivals */}
      <PinnedFestivalsList 
        pinnedFestivals={pinnedFestivals} 
        onSelectFestival={(f) => { setSelectedFestival(f); setView('details'); }} 
      />

      {/* Upcoming Section */}
      <UpcomingDeadlinesList 
        upcomingDeadlines={upcomingDeadlines} 
        onSelectFestival={(f) => { setSelectedFestival(f); setView('details'); }} 
      />

      {/* Auto / Closed Festivals Section */}
      <AutoClosedFestivalsList 
        closedFestivals={closedFestivals} 
        onSelectFestival={(f) => { setSelectedFestival(f); setView('details'); }} 
      />
    </div>
  );
};
