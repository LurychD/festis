import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArchiveRestore, Trash2, MapPin, Calendar as CalendarIcon, PackageOpen } from 'lucide-react';
import { Festival, FestivalStatus } from '../types';
import { cn, getStatusColorStyles, getStatusIcon, formatDisplayDate } from '../utils/helpers';

interface ArchiveViewProps {
  festivals: Festival[];
  setFestivals: (f: Festival[]) => void;
  setSelectedFestival: (f: Festival) => void;
  setView: (v: string) => void;
  isAuthorized: boolean;
  showAlert: (msg: string) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  festivals,
  setFestivals,
  setSelectedFestival,
  setView,
  isAuthorized,
  showAlert,
}) => {
  const archivedFestivals = festivals.filter((f) => f.archived);

  const handleUnarchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthorized) return;
    setFestivals(
      festivals.map((f) =>
        f.id === id ? { ...f, archived: false } : f
      )
    );
    showAlert("Festival desarchivado.");
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthorized) return;
    if (window.confirm('¿Estás seguro de que quieres eliminar permanentemente este festival?')) {
      setFestivals(festivals.filter((f) => f.id !== id));
      showAlert("Festival eliminado permanentemente.");
    }
  };

  return (
    <div className="space-y-6 pb-32 pt-6 max-w-5xl mx-auto px-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl md:text-2xl font-black tracking-tighter text-slate-800 flex items-center gap-3">
          <PackageOpen className="h-6 w-6 md:h-8 md:w-8 text-slate-500" />
          Baúl de Festis
        </h1>
        <p className="text-slate-500 text-xs md:text-sm max-w-xl">
          Aquí se encuentran los festivales que has archivado. Puedes desarchivarlos para que vuelvan a aparecer en las vistas principales o eliminarlos permanentemente.
        </p>
      </header>

      {archivedFestivals.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 border border-slate-100 rounded-3xl">
          <PackageOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">El baúl de festis está vacío.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {archivedFestivals.map((festival, i) => {
              const StatusIcon = getStatusIcon(festival.status);
              const isClosed = festival.status === FestivalStatus.CERRADO || (festival.status as string) === 'Cerrado';
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={`${festival.id}-${i}`}
                  onClick={() => {
                    setSelectedFestival(festival);
                    setView("details");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={cn("p-6 rounded-3xl cursor-pointer group hover:scale-[1.02] transition-all border border-white/40 flex flex-col justify-between shadow-lg relative", getStatusColorStyles(festival.status))}
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-lg uppercase tracking-tight leading-tight flex items-start gap-2">
                        <span className="text-slate-400 text-sm mt-0.5 shrink-0">#{i + 1}</span>
                        <span className="break-words">{festival.name}</span>
                      </h3>
                      <div className="flex flex-col gap-1.5 mt-2 text-[10px] uppercase tracking-widest font-bold opacity-90">
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          <span className={cn("flex items-center gap-1 border px-1.5 py-0.5 rounded-md text-[9px]", isClosed ? "border-slate-300 text-slate-600 bg-slate-200/60" : "border-black/10")}>ID: {festival.id}</span>
                        </div>
                        <div className={cn("flex flex-wrap gap-x-3 gap-y-1 mt-0.5 text-[9px]", isClosed ? "text-slate-600" : "text-black/60")}>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {festival.country || "País no especificado"}</span>
                        </div>
                        <div className={cn("flex flex-wrap gap-x-3 gap-y-1.5 mt-1", isClosed ? "text-slate-700" : "text-slate-700")}>
                          <span className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-md", isClosed ? "bg-slate-200/80 text-slate-700 border border-slate-300" : "bg-white/50")}>
                            <CalendarIcon className="h-3 w-3" /> Cierre: {festival.deadline ? formatDisplayDate(festival.deadline) : 'PENDIENTE'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-between h-full gap-4">
                      <div className="flex items-center gap-1">
                        {StatusIcon}
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest border px-2.5 py-1 rounded-full shadow-sm",
                          isClosed ? "border-slate-400 bg-slate-200 text-slate-800" : "border-black/10 bg-white/50 text-black/80"
                        )}>
                          {festival.status}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 z-10">
                         <button
                           onClick={(e) => handleUnarchive(festival.id, e)}
                           className="p-2.5 bg-white/80 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm border border-black/5"
                           title="Desarchivar"
                         >
                           <ArchiveRestore className="h-5 w-5" />
                         </button>
                         <button
                           onClick={(e) => handleDelete(festival.id, e)}
                           className="p-2.5 bg-red-50 text-red-500 hover:text-white hover:bg-red-500 rounded-xl transition-all shadow-sm border border-red-100"
                           title="Eliminar permanentemente"
                         >
                           <Trash2 className="h-5 w-5" />
                         </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
