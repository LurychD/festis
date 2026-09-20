import React from 'react';
import { Festival, FestivalStatus } from '../../types';
import { Lock, ChevronRight, Sparkles } from 'lucide-react';
import { formatDisplayDate, getStatusIcon } from '../../utils/helpers';

interface AutoClosedFestivalsListProps {
  closedFestivals: Festival[];
  onSelectFestival: (f: Festival) => void;
}

export const AutoClosedFestivalsList: React.FC<AutoClosedFestivalsListProps> = ({ closedFestivals, onSelectFestival }) => {
  if (!closedFestivals || closedFestivals.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
        <Lock className="h-4 w-4 text-slate-600" /> Festivales Cerrados esta semana ({closedFestivals.length})
      </h3>
      <div className="space-y-3">
        {closedFestivals.slice(0, 10).map((f, idx) => {
          const isAutoClosed = f.statusHistory?.some(h => h.updatedBy?.includes("Cierre Automático") || h.note?.includes("Cierre Automático"));
          
          return (
            <div 
              key={`closed-${f.id}-${idx}`} 
              onClick={() => onSelectFestival(f)}
              className="p-4 rounded-3xl cursor-pointer hover:bg-slate-200/80 transition-all flex items-center justify-between bg-slate-100/80 backdrop-blur-md border border-slate-300 text-slate-700 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                   {getStatusIcon(f.status)}
                   <span className="text-[10px] uppercase font-bold text-slate-600">Cerrado</span>
                   {isAutoClosed && (
                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-200 text-slate-700 border border-slate-300">
                       <Sparkles className="h-2.5 w-2.5 text-slate-500" /> Sistema
                     </span>
                   )}
                </div>
                <p className="font-black text-sm mt-1 leading-tight pr-4 text-slate-900">{f.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">
                  {f.deadline ? `Venció: ${formatDisplayDate(f.deadline)}` : 'Convocatoria Finalizada'} • {f.country}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50 shrink-0 text-slate-500" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
