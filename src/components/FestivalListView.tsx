import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Search, MapPin, List, Tag, DollarSign, Calendar as CalendarIcon, ExternalLink, ClipboardList, MonitorPlay, RefreshCw } from 'lucide-react';
import { Festival, FestivalStatus } from '../types';
import { cn, getStatusColorStyles, getStatusIcon, formatDisplayDate } from '../utils/helpers';
import { INITIAL_FESTIVALS } from '../utils/seedData';
import { ChangeStatusModal } from './ChangeStatusModal';

interface FestivalListViewProps {
  festivals: Festival[];
  filteredFestivals: Festival[];
  setFestivals: (f: Festival[]) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  dateFilter: string;
  setDateFilter: (f: string) => void;
  displayedCount: number;
  setDisplayedCount: React.Dispatch<React.SetStateAction<number>>;
  setSelectedFestival: (f: Festival) => void;
  setView: (v: string) => void;
  search: string;
  searchInObs: boolean;
  handleUpdateStatus?: (id: string, newStatus: FestivalStatus, note?: string) => void;
}

const highlightText = (text: string, search: string) => {
  if (!text) return "";
  if (!search.trim()) return <span>{text}</span>;
  try {
    const strippedText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const strippedSearch = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const idx = strippedText.indexOf(strippedSearch);
    if (idx === -1) {
      const tokens = strippedSearch.split(/\s+/).filter(t => t.length > 2);
      if (tokens.length > 0) {
        for (const token of tokens) {
          const tIdx = strippedText.indexOf(token);
          if (tIdx !== -1) {
            const before = text.substring(0, tIdx);
            const match = text.substring(tIdx, tIdx + token.length);
            const after = text.substring(tIdx + token.length);
            return (
              <>
                {before}
                <mark className="bg-yellow-300 text-slate-950 font-black px-1 rounded-md shadow-2xs">
                  {match}
                </mark>
                {after}
              </>
            );
          }
        }
      }
      return <span>{text}</span>;
    }
    
    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + search.length);
    const after = text.substring(idx + search.length);
    
    return (
      <>
        {before}
        <mark className="bg-yellow-300 text-slate-950 font-black px-1 rounded-md shadow-2xs">
          {match}
        </mark>
        {after}
      </>
    );
  } catch (e) {
    return <span>{text}</span>;
  }
};

export const FestivalListView: React.FC<FestivalListViewProps> = ({
  festivals, filteredFestivals, setFestivals,
  filterStatus, setFilterStatus, dateFilter, setDateFilter,
  displayedCount, setDisplayedCount, setSelectedFestival, setView,
  search, searchInObs, handleUpdateStatus
}) => {
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [isDraggingFilter, setIsDraggingFilter] = useState(false);
  const [filterStartX, setFilterStartX] = useState(0);
  const [filterScrollLeft, setFilterScrollLeft] = useState(0);
  const [statusTargetFestival, setStatusTargetFestival] = useState<Festival | null>(null);

  const renderObs = (obs?: string) => {
    if (!obs) return null;
    const truncated = obs.length > 50 ? obs.substring(0, 50) + '...' : obs;
    return (
      <div className="text-slate-500 italic mt-0.5 block w-full">
        Obs: {highlightText(truncated, search)}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-32">
      <div className="sticky top-24 z-40 bg-white pt-4 pb-2 rounded-3xl overflow-hidden shadow-sm border border-slate-200 mb-4 px-2">
        <div 
          ref={filterScrollRef}
          onMouseDown={(e) => {
            if (!filterScrollRef.current) return;
            setIsDraggingFilter(true);
            setFilterStartX(e.pageX - filterScrollRef.current.offsetLeft);
            setFilterScrollLeft(filterScrollRef.current.scrollLeft);
          }}
          onMouseLeave={() => setIsDraggingFilter(false)}
          onMouseUp={() => setIsDraggingFilter(false)}
          onMouseMove={(e) => {
            if (!isDraggingFilter || !filterScrollRef.current) return;
            e.preventDefault();
            const x = e.pageX - filterScrollRef.current.offsetLeft;
            const walk = (x - filterStartX) * 2;
            filterScrollRef.current.scrollLeft = filterScrollLeft - walk;
          }}
          className={cn("flex gap-2 overflow-x-auto pb-4 scrollbar-none px-2", isDraggingFilter ? "cursor-grabbing select-none" : "cursor-grab")}
        >
          {['all', ...Object.values(FestivalStatus)].map((s, idx) => (
            <button id={`btn-auto-10-${s}`}
              key={`${s}-${idx}`}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs font-bold transition-all border shadow-sm",
                filterStatus === s 
                  ? "bg-[#e91e63] border-[#e91e63] text-white shadow-[#e91e63]/20" 
                  : "bg-white border-slate-200 text-slate-600 hover:text-slate-800"
              )}
            >
              {s === 'all' ? 'Todos' : s}
            </button>
          ))}
          <button id="btn-auto-11"
            onClick={() => setDateFilter(dateFilter === 'all' ? 'closing_soon' : 'all')}
            className={cn(
              "whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 border shadow-sm",
              dateFilter === 'closing_soon' 
                ? "bg-[#e91e63] border-[#e91e63] text-white" 
                : "bg-white border-slate-200 text-slate-600 hover:text-slate-800"
            )}
          >
            <Bell className="h-3.5 w-3.5 shrink-0" /> En Cierre ⏰
          </button>
        </div>
      </div>

      <div className="w-full flex items-center justify-between mb-4 px-1">
         <p className="text-xs font-bold text-slate-500">
           <span className="text-[#e91e63] font-black">{filteredFestivals.length}</span> festivales encontrados 
           {filterStatus !== 'all' ? ` bajo el filtro "${filterStatus}"` : ' en total'}
           {dateFilter === 'closing_soon' ? ' (En cierre próx. 30 días)' : ''}
           {dateFilter === 'custom_range' ? ' (Rango de fechas)' : ''}
         </p>
      </div>

      <div className="space-y-4 relative min-h-[40vh]">
        {filteredFestivals.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="h-24 w-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 transform rotate-3">
              <Search className="h-10 w-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No se encontraron festivales</h3>
            <p className="text-sm text-slate-600 max-w-sm">No hay festivales que coincidan con los filtros. O quizás la base de datos está vacía.</p>
            {festivals.length === 0 && (
              <button id="btn-restore-festivals"
                onClick={() => setFestivals(INITIAL_FESTIVALS)}
                className="mt-6 px-6 py-3 bg-[#e91e63] text-white rounded-2xl font-bold text-xs hover:scale-105 transition-all shadow-lg shadow-[#e91e63]/20"
              >
                Restaurar Datos de Prueba
              </button>
            )}
          </div>
        )}
        {filteredFestivals.slice(0, displayedCount).map((festival, i) => {
          const isClosed = festival.status === FestivalStatus.CERRADO || (festival.status as string) === 'Cerrado';
          return (
          <div 
            key={`${festival.id}-${i}`} 
            className={cn("p-6 rounded-3xl cursor-pointer group hover:scale-[1.02] transition-all border border-white/40 flex flex-col justify-between shadow-lg", getStatusColorStyles(festival.status))}
            onClick={() => { setSelectedFestival(festival); setView('details'); }}
          >
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg leading-tight flex items-start gap-2">
                   <span className="text-slate-400 text-sm mt-0.5 shrink-0">#{i + 1}</span> 
                   <span className="break-words">{highlightText(festival.name, search)}</span>
                </h3>
                <div className="flex flex-col gap-1.5 mt-2 text-xs font-semibold opacity-90">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className={cn("flex items-center gap-1 border px-1.5 py-0.5 rounded-md text-[9px]", isClosed ? "border-slate-300 text-slate-600 bg-slate-200/60" : "border-black/10")}>ID: {festival.id}</span>
                    {festival.isPreliminary && (
                      <span className="flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                        Preliminar
                      </span>
                    )}
                    {festival.distributionPlanId && (
                      <span className="flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                        En Plan de Distribución
                      </span>
                    )}
                  </div>
                  <div className={cn("flex flex-wrap gap-x-3 gap-y-1 mt-0.5 text-[9px]", isClosed ? "text-slate-600" : "text-black/60")}>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {highlightText(festival.country, search)}</span>
                    <span className="flex items-center gap-1"><List className="h-3 w-3" /> {festival.type}</span>
                    {(['En Revision', 'Seleccionado', 'Ganado', 'No Seleccionado', 'Proyectado', 'En duda', 'Descalificado', 'Cerrado'].includes(festival.status) && festival.category) && (
                       <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {highlightText(festival.category, search)}</span>
                    )}
                    {(['Por enviar', 'En duda', 'No Seleccionado', 'Descalificado', 'En Revision', 'Cerrado'].includes(festival.status) && festival.price) && (
                       <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Fee: {festival.price}</span>
                    )}
                  </div>
                  
                  <div className={cn("flex flex-wrap gap-x-3 gap-y-1.5 mt-1", isClosed ? "text-slate-700" : "text-slate-700")}>
                     {festival.status === 'Por enviar' && (
                        <>
                           <span className="flex items-center gap-1 text-[#e91e63] bg-pink-50 px-1.5 py-0.5 rounded-md"><CalendarIcon className="h-3 w-3" /> Cierre: {festival.deadline ? formatDisplayDate(festival.deadline) : 'PENDIENTE'}</span>
                           {festival.link && (
                              <a href={festival.link.startsWith('http') ? festival.link : `https://${festival.link}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-white bg-[#e91e63] px-2 py-0.5 rounded-md hover:bg-[#c2185b] transition-colors" onClick={(e) => e.stopPropagation()}>
                                 <ExternalLink className="h-3 w-3" /> Enviar
                              </a>
                           )}
                           <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                              <ClipboardList className="h-3 w-3" /> {festival.tasks?.filter(t => !t.completed).length || 0} pendientes
                           </span>
                           {renderObs(festival.observations)}
                        </>
                     )}
                     {festival.status === 'Proximamente' && (
                        <>
                           {renderObs(festival.observations)}
                        </>
                     )}
                     {festival.status === 'En Revision' && (
                        <>
                           <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md"><Bell className="h-3 w-3" /> Noticia: {festival.newsDate ? formatDisplayDate(festival.newsDate) : 'PENDIENTE'}</span>
                           {renderObs(festival.observations)}
                        </>
                     )}
                     {(festival.status === 'Seleccionado' || festival.status === 'Ganado') && (
                        <>
                           {festival.nomination && <span className="inline-flex items-start gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md max-w-full text-xs font-semibold leading-tight"><span className="shrink-0">🏆</span> <span>{festival.nomination}</span></span>}
                           <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-xs font-semibold shrink-0"><Bell className="h-3 w-3" /> Noticia: {festival.newsDate ? formatDisplayDate(festival.newsDate) : 'PENDIENTE'}</span>
                           <span className="inline-flex items-center gap-1 text-sky-600 bg-sky-50 px-2 py-1 rounded-md text-xs font-semibold shrink-0"><MonitorPlay className="h-3 w-3" /> Proyección: {formatDisplayDate(festival.projectionDate)}</span>
                           {festival.projectionLocation && (
                              <a href={`https://maps.google.com/?q=${encodeURIComponent(festival.projectionLocation)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 text-white bg-[#e91e63] px-2 py-1 rounded-md hover:bg-[#c2185b] transition-colors max-w-[200px] text-xs font-semibold leading-tight overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                 <MapPin className="h-3 w-3 shrink-0 mt-0.5" /> <span className="truncate">Lugar: {festival.projectionLocation}</span>
                              </a>
                           )}
                           <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                              <ClipboardList className="h-3 w-3" /> {festival.tasks?.filter(t => !t.completed).length || 0} pendientes
                           </span>
                           {renderObs(festival.observations)}
                        </>
                     )}
                     {festival.status === 'No Seleccionado' && (
                        <>
                           {renderObs(festival.observations)}
                        </>
                     )}
                     {festival.status === 'Proyectado' && (
                        <>
                           {festival.nomination && <span className="inline-flex items-start gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md max-w-full text-xs font-semibold leading-tight"><span className="shrink-0">🏆</span> <span>{festival.nomination}</span></span>}
                           <span className="inline-flex items-center gap-1 text-sky-600 bg-sky-50 px-2 py-1 rounded-md text-xs font-semibold shrink-0"><MonitorPlay className="h-3 w-3" /> Proyección: {formatDisplayDate(festival.projectionDate)}</span>
                           {festival.projectionLocation && (
                              <a href={`https://maps.google.com/?q=${encodeURIComponent(festival.projectionLocation)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 text-white bg-[#e91e63] px-2 py-1 rounded-md hover:bg-[#c2185b] transition-colors max-w-[200px] text-xs font-semibold leading-tight overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                 <MapPin className="h-3 w-3 shrink-0 mt-0.5" /> <span className="truncate">Lugar: {festival.projectionLocation}</span>
                              </a>
                           )}
                           {renderObs(festival.observations)}
                        </>
                     )}
                     {festival.status === 'En duda' && (
                        <>
                           <span className="flex items-center gap-1 text-[#e91e63] bg-pink-50 px-1.5 py-0.5 rounded-md"><CalendarIcon className="h-3 w-3" /> Cierre: {festival.deadline ? formatDisplayDate(festival.deadline) : 'PENDIENTE'}</span>
                           {renderObs(festival.observations)}
                        </>
                     )}
                     {festival.status === 'Descalificado' && (
                        <>
                           <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md"><Bell className="h-3 w-3" /> Noticia: {festival.newsDate ? formatDisplayDate(festival.newsDate) : 'PENDIENTE'}</span>
                           {renderObs(festival.observations)}
                        </>
                     )}
                     {isClosed && (
                        <>
                           <span className="flex items-center gap-1 text-slate-700 bg-slate-200/80 border border-slate-300 px-1.5 py-0.5 rounded-md"><CalendarIcon className="h-3 w-3 text-slate-500" /> Cierre vencido: {festival.deadline ? formatDisplayDate(festival.deadline) : 'N/A'}</span>
                           {renderObs(festival.observations)}
                        </>
                     )}
                  </div>
                </div>
              </div>
              <span 
                onClick={(e) => {
                  if (handleUpdateStatus) {
                    e.stopPropagation();
                    setStatusTargetFestival(festival);
                  }
                }}
                className={cn(
                  "shrink-0 px-3 py-1 rounded-full text-xs font-bold border shadow-sm flex items-center gap-1 hover:scale-105 transition-all cursor-pointer",
                  isClosed
                    ? "bg-slate-200 text-slate-800 border-slate-400 hover:bg-slate-300"
                    : "bg-white/90 text-slate-800",
                  handleUpdateStatus && "hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"
                )}
                title="Haz clic para cambiar estado con nota"
              >
                {getStatusIcon(festival.status, 'h-3.5 w-3.5 mr-1')}
                {festival.status}
              </span>
            </div>
            
            {(festival.tasks && festival.tasks.length > 0) && (
              <div className={cn("mt-4 pt-4 border-t", isClosed ? "border-zinc-700" : "border-black/10")}>
                <div className="flex justify-between text-xs font-bold opacity-80 mb-2">
                  <span>Checklist Seguimiento</span>
                  <span>{Math.round((festival.tasks.filter(t => t.completed).length / festival.tasks.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-black/40 transition-all duration-500" 
                    style={{ width: `${(festival.tasks.filter(t => t.completed).length / festival.tasks.length) * 100}%` }} 
                  />
                </div>
              </div>
            )}
          </div>
          );
        })}
        {filteredFestivals.length === 0 && (
          <div className="text-center py-20 glass-card">
            <Search className="h-10 w-10 text-[#e91e63]/40 mx-auto mb-4" />
            <p className="text-slate-600 font-semibold text-xs">No se encontraron festivales</p>
          </div>
        )}
        {displayedCount < filteredFestivals.length && (
          <motion.div 
            onViewportEnter={() => setDisplayedCount(prev => prev + 10)} 
            className="h-10 w-full flex items-center justify-center"
          >
            <div className="animate-spin h-6 w-6 border-2 border-[#e91e63] border-t-transparent rounded-full"></div>
          </motion.div>
        )}
      </div>

      {handleUpdateStatus && (
        <ChangeStatusModal
          isOpen={!!statusTargetFestival}
          onClose={() => setStatusTargetFestival(null)}
          festival={statusTargetFestival}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};
