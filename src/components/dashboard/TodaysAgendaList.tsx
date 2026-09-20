import React from 'react';
import { Festival, FestivalStatus, Task } from '../../types';
import { Bell, Hourglass, Projector, CheckCircle2, Megaphone, ChevronRight, Clock, MapPin, Tag, AtSign, Lock } from 'lucide-react';
import { formatDisplayDate, getTimeSinceSubmitted } from '../../utils/helpers';
import { format } from 'date-fns';
import { useFirestoreSyncArray } from '../../hooks/useFirestoreSync';
import { SocialPost } from '../../types';
import { cn } from '../../utils/helpers';

export interface AgendaItem {
  id: string;
  type: 'cierre' | 'proyeccion' | 'notificacion' | 'tarea' | 'recordatorio';
  festival?: Festival;
  task?: Task;
  recordatorio?: any;
}

interface TodaysAgendaListProps {
  agendaItems: AgendaItem[];
  userName: string;
  onSelectFestival: (f: Festival) => void;
  setView?: (view: any) => void;
}

export const TodaysAgendaList: React.FC<TodaysAgendaListProps> = ({ agendaItems, userName, onSelectFestival, setView }) => {
  const [socialPosts] = useFirestoreSyncArray<SocialPost>("social_posts");
  const pendingPostsCount = socialPosts.filter(p => p.status === 'pending' || p.status === 'draft').length;
  const renderSocialCard = () => {
    if (!setView) return null;
    return (
      <div 
        onClick={() => setView('social_media')}
        className="p-4 rounded-3xl cursor-pointer hover:opacity-90 transition-all flex items-center justify-between shadow-sm relative overflow-hidden"
        style={{ 
          borderWidth: '3px', 
          backgroundColor: '#e0f2fe',
          borderColor: '#0284c7',
          color: '#0284c7' 
        }}
      >
        <div className="flex-1 w-full flex flex-col gap-1.5 z-10">
           <div className="flex items-center gap-2">
              <AtSign className="h-4 w-4" style={{ color: '#0284c7' }} />
              <span className="text-[11px] font-bold" style={{ color: '#0284c7' }}>Modo Redes</span>
           </div>
           <p className="font-black text-sm uppercase leading-tight pr-4 text-sky-900">
             REDES
           </p>
           <p className="text-[11px] font-bold mt-1 text-sky-700">
             [{pendingPostsCount}] pendientes
           </p>
        </div>
        <button 
          className="z-10 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm transition translate-x-2"
          style={{ backgroundColor: '#0284c7', color: 'white' }}
        >
           Ver
        </button>
        <AtSign className="absolute right-[-10%] top-[-20%] h-32 w-32 opacity-5 text-sky-900" />
      </div>
    );
  };

  const getRemainingHoursText = () => {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const diffMs = endOfDay.getTime() - now.getTime();
    if (diffMs <= 0) return 'Menos de 1h';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `Quedan ${hours}h ${mins}m para el cierre`;
    }
    return `Quedan ${mins}m para el cierre`;
  };

  if (agendaItems.length === 0) {
    return (
      <div className="space-y-4">
        {renderSocialCard()}
        <div className="px-6 py-8 rounded-3xl glass border border-white/40 flex flex-col items-center justify-center text-center shadow-md">
          <h3 className="text-sm font-medium flex items-center gap-3 text-slate-600">
            <span className="text-2xl">😴</span>
            <span className="text-left">Hola {userName}.<br/> Hoy no hay nada (que aburrido).</span>
          </h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color: '#591d09' }}>
        <Bell className="h-4 w-4" style={{ color: '#591d09' }} /> Hola {userName}, hoy tenemos: ({agendaItems.length})
      </h3>
      <div className="space-y-3">
        {renderSocialCard()}

        {agendaItems.map((item, idx) => {
           const f = item.festival;
           
           if (item.type === 'cierre' && f) {
               const isClosed = f.status === FestivalStatus.CERRADO || (f.status as string) === 'Cerrado';
               if (isClosed) {
                 return (
                   <div 
                     key={`${item.id}-${idx}`}
                     onClick={() => onSelectFestival(f)}
                     className="p-4 rounded-3xl cursor-pointer hover:opacity-90 transition-all flex items-center justify-between shadow-sm"
                     style={{ 
                       borderWidth: '3px', 
                       backgroundColor: '#f1f5f9', 
                       borderColor: '#64748b', 
                       color: '#334155' 
                     }}
                   >
                     <div className="flex-1 w-full">
                       <div className="flex items-center justify-between w-full flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                             <Lock className="h-4 w-4 text-slate-600" />
                             <span className="text-[11px] font-bold text-slate-700">Cerró hoy:</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-600 text-white flex items-center gap-1 shadow-sm">
                             CERRADO
                          </span>
                       </div>
                       <p className="font-black text-sm uppercase mt-1 leading-tight pr-4 text-slate-900">{f.name}</p>
                       <p className="text-[11px] font-medium opacity-90 mt-1 text-slate-700">
                         Plataforma: {f.platform || 'N/A'} • {f.price ? `${f.price}` : 'Gratis'}
                       </p>
                     </div>
                     <ChevronRight className="h-4 w-4 opacity-50 shrink-0 text-slate-500" />
                   </div>
                 );
               }

               const isSubmitted = f.status !== FestivalStatus.POR_ENVIAR && f.status !== FestivalStatus.PROXIMAMENTE && f.status !== FestivalStatus.EN_DUDA;
               if (isSubmitted) {
                 const timeSince = getTimeSinceSubmitted(f);
                 return (
                   <div 
                     key={`${item.id}-${idx}`}
                     onClick={() => onSelectFestival(f)}
                     className="p-4 rounded-3xl cursor-pointer hover:opacity-90 transition-all flex items-center justify-between shadow-sm"
                     style={{ 
                       borderWidth: '3px', 
                       backgroundColor: '#f0fdf4', 
                       borderColor: '#16a34a', 
                       color: '#15803d' 
                     }}
                   >
                     <div className="flex-1 w-full">
                       <div className="flex items-center justify-between w-full flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                             <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                             <span className="text-[11px] font-bold text-emerald-800">Cierra hoy (Ya enviado • {getRemainingHoursText()}):</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {timeSince && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-emerald-600" /> {timeSince}
                              </span>
                            )}
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                              <CheckCircle2 className="h-3 w-3" /> ENVIADO ({f.status})
                            </span>
                          </div>
                       </div>
                       <p className="font-black text-sm uppercase mt-1 leading-tight pr-4 text-emerald-950">{f.name}</p>
                       <p className="text-[11px] font-medium opacity-90 mt-1 text-emerald-800">
                         Plataforma: {f.platform || 'N/A'} • {f.price ? `${f.price}` : 'Gratis'}
                         {timeSince ? ` • Enviado ${timeSince}` : ''}
                       </p>
                       
                       <div className="mt-3 flex justify-end">
                          <button 
                             onClick={(e) => {
                                e.stopPropagation();
                                if (f.link) window.open(f.link, '_blank');
                                else onSelectFestival(f);
                             }}
                             className="px-4 py-1.5 rounded-full font-bold text-xs shadow-sm transition-transform hover:-translate-y-0.5 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer" 
                          >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Ver Inscripción
                          </button>
                       </div>
                     </div>
                   </div>
                 );
               }

               return (
                 <div 
                   key={`${item.id}-${idx}`}
                   onClick={() => onSelectFestival(f)}
                   className="p-4 rounded-3xl cursor-pointer hover:opacity-90 transition-all flex items-center justify-between shadow-sm"
                   style={{ 
                     borderWidth: '4px', 
                     backgroundColor: '#ffdddd', 
                     borderColor: '#b74949', 
                     color: '#b74949' 
                   }}
                 >
                   <div className="flex-1 w-full">
                     <div className="flex items-center justify-between w-full flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                           <Hourglass className="h-4 w-4" />
                           <span className="text-[11px] font-bold" style={{ color: '#b74949' }}>Cierra hoy ({getRemainingHoursText()}):</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white flex items-center gap-1 shadow-sm">
                          <Clock className="h-3 w-3" /> PENDIENTE ({f.status || 'Por enviar'})
                        </span>
                     </div>
                     <p className="font-black text-sm uppercase mt-1 leading-tight pr-4" style={{ color: '#870633' }}>{f.name}</p>
                     <p className="text-[11px] font-medium opacity-90 mt-1" style={{ color: '#870633' }}>Plataforma: {f.platform || 'N/A'} • {f.price ? `${f.price}` : 'Gratis'}</p>
                     
                     <div className="mt-3 flex justify-end">
                        <button 
                           onClick={(e) => {
                              e.stopPropagation();
                              if (f.link) window.open(f.link, '_blank');
                              else onSelectFestival(f);
                           }}
                           className="px-4 py-1.5 rounded-full font-bold text-xs shadow-sm transition-transform hover:-translate-y-0.5 text-white flex items-center gap-1.5 cursor-pointer" 
                           style={{ backgroundColor: '#b74949' }}
                        >
                            <Hourglass className="h-3.5 w-3.5" /> Inscribir ahora
                        </button>
                     </div>
                   </div>
                 </div>
               );
           }

           if (item.type === 'proyeccion' && f) {
               const timeStr = f.projectionDate && f.projectionDate.includes('T') ? format(new Date(f.projectionDate), 'HH:mm') + 'hs' : '';
               return (
                 <div 
                   key={`${item.id}-${idx}`}
                    onClick={() => onSelectFestival(f)}
                   className="p-4 rounded-3xl cursor-pointer hover:opacity-90 transition-all flex items-center justify-between shadow-sm"
                   style={{ 
                     borderWidth: '3px', 
                     backgroundColor: '#fff0d5', 
                     borderColor: '#b07c17', 
                     color: '#b07c17' 
                   }}
                 >
                   <div className="flex-1 w-full flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                         <Projector className="h-4 w-4" style={{ color: '#b07c17' }} />
                         <span className="text-[11px] font-bold" style={{ color: '#b07c17' }}>Se proyecta(n):</span>
                      </div>
                      <p className="font-black text-sm uppercase leading-tight pr-4" style={{ color: '#9a3900' }}>
                        {f.name}
                      </p>
                      
                      {timeStr && (
                        <div className="flex items-center gap-1 mt-1">
                           <Clock className="w-3.5 h-3.5" style={{ color: '#b07c17' }} />
                           <span className="text-xs font-bold" style={{ color: '#9a3900' }}>{timeStr}</span>
                        </div>
                      )}

                      {(f.projectionLocation || f.category || f.nomination) && (
                        <div className="flex flex-col gap-1 mt-1 opacity-90">
                          {f.projectionLocation && (
                            <div className="flex items-center gap-1.5">
                               <MapPin className="w-3 h-3" style={{ color: '#b07c17' }} />
                               <span className="text-[12px] font-medium">{f.projectionLocation}</span>
                            </div>
                          )}
                          {(f.category || f.nomination) && (
                            <div className="flex items-start gap-1.5">
                               <Tag className="w-3 h-3 shrink-0 mt-0.5" style={{ color: '#b07c17' }} />
                               <span className="text-[11px] font-medium" style={{ lineHeight: '1.2' }}>
                                 {[f.category, f.nomination].filter(Boolean).join(' • ')}
                               </span>
                            </div>
                          )}
                        </div>
                      )}
                   </div>
                   <ChevronRight className="h-4 w-4 opacity-50 shrink-0" />
                 </div>
               );
           }

           if (item.type === 'tarea' && f) {
               return (
                 <div 
                   key={`${item.id}-${idx}`}
                    onClick={() => onSelectFestival(f)}
                   className="p-4 rounded-3xl cursor-pointer hover:opacity-90 transition-all flex items-center justify-between shadow-sm"
                   style={{ 
                     borderWidth: '3px', 
                     backgroundColor: '#fdf4ff', 
                     borderColor: '#e879f9', 
                     color: '#d946ef' 
                   }}
                 >
                   <div className="flex-1 w-full">
                      <div className="flex items-center gap-2">
                         <CheckCircle2 className="h-4 w-4 opacity-80" />
                         <span className="text-[11px] font-bold tracking-widest capitalize">Tarea con vencimiento:</span>
                      </div>
                      <p className="font-bold text-sm mt-1 leading-tight pr-4" style={{ color: '#86198f' }}>{item.task?.title}</p>
                      <p className="text-[11px] font-medium opacity-90 mt-1" style={{ color: '#a21caf' }}>Fest: {f?.name} • Vence: {item.task?.dueDate ? formatDisplayDate(item.task.dueDate) : 'Sin fecha'}</p>
                   </div>
                   <ChevronRight className="h-4 w-4 opacity-50 shrink-0" />
                 </div>
               );
           }

           if (item.type === 'notificacion' && f) {
               return (
                 <div 
                   key={`${item.id}-${idx}`}
                    onClick={() => onSelectFestival(f)}
                   className="p-4 rounded-3xl cursor-pointer hover:bg-emerald-100/70 transition-all flex items-center justify-between text-emerald-900 shadow-sm shadow-emerald-100/50"
                   style={{ backgroundColor: '#ccfbf1', borderWidth: '3px', borderColor: '#4cdc84' }}
                 >
                   <div>
                      <div className="flex items-center gap-2">
                         <Megaphone className="h-4 w-4" style={{ color: '#059669' }} />
                         <span className="text-[11px] font-bold" style={{ color: '#059669' }}>Notifica (n) :</span>
                      </div>
                      <p className="font-black text-sm uppercase mt-1 leading-tight pr-4" style={{ color: '#006d0d' }}>{f.name}</p>
                      <p className="text-[11px] font-medium opacity-90 mt-1" style={{ color: '#006d0d' }}>{f.country}</p>
                   </div>
                   <ChevronRight className="h-4 w-4 opacity-50 shrink-0" />
                 </div>
               );
           }

           if (item.type === 'recordatorio') {
               return (
                 <div 
                   key={`${item.id}-${idx}`}
                    onClick={() => item.festival && onSelectFestival(item.festival)}
                   className={cn(
                     "p-4 rounded-3xl transition-all flex items-center justify-between shadow-sm",
                     item.festival ? "cursor-pointer hover:bg-cyan-50" : ""
                   )}
                   style={{ 
                     backgroundColor: '#ecfeff', 
                     borderWidth: '3px', 
                     borderColor: '#22d3ee',
                     color: '#0891b2'
                   }}
                 >
                   <div>
                      <div className="flex items-center gap-2">
                         <Clock className="h-4 w-4" style={{ color: '#0891b2' }} />
                         <span className="text-[11px] font-bold tracking-widest capitalize" style={{ color: '#0891b2' }}>{item.recordatorio?.title || 'Recordatorio'}</span>
                      </div>
                      <p className="font-bold text-sm mt-1 leading-tight pr-4 text-cyan-900">{item.recordatorio?.message}</p>
                      {item.festival && (
                        <p className="text-[10px] uppercase font-bold mt-2 opacity-80" style={{ color: '#0e7490' }}>
                          Vinculado: {item.festival.name}
                        </p>
                      )}
                   </div>
                   {item.festival && <ChevronRight className="h-4 w-4 opacity-50 shrink-0" />}
                 </div>
               );
           }
           
           return null;
        })}
      </div>
    </>
  );
};
