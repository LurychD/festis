import React from 'react';
import { Festival } from '../../types';
import { Pin, Hourglass } from 'lucide-react';
import { formatDisplayDate, getStatusColorStyles } from '../../utils/helpers';
import { cn } from '../../utils/helpers';

// Ensure we have same getRelevantDateForPinned logic
const getRelevantDateForPinned = (f: Festival) => {
  const now = new Date();
  
  if (f.deadline && new Date(f.deadline) >= now) {
    return { label: 'Cierre', date: f.deadline };
  }
  if (f.newsDate && new Date(f.newsDate) >= now) {
    return { label: 'Aviso', date: f.newsDate };
  }
  if (f.projectionDate && new Date(f.projectionDate) >= now) {
    return { label: 'Proy', date: f.projectionDate };
  }
  
  return null;
};

interface PinnedFestivalsListProps {
  pinnedFestivals: Festival[];
  onSelectFestival: (f: Festival) => void;
}

export const PinnedFestivalsList: React.FC<PinnedFestivalsListProps> = ({ pinnedFestivals, onSelectFestival }) => {
  if (pinnedFestivals.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-[#e91e63] flex items-center gap-2">
        <Pin className="h-4 w-4 fill-current" /> Pineados ({pinnedFestivals.length})
      </h3>
      <div className="space-y-3">
        {pinnedFestivals.map((f, idx) => (
          <div 
            key={`${f.id}-${idx}`} 
            onClick={() => onSelectFestival(f)}
            className={cn(
              "p-5 rounded-3xl cursor-pointer hover:scale-[1.01] transition-all flex items-start justify-between gap-4 shadow-md border-2",
              getStatusColorStyles(f.status)
            )}
          >
            <div className="flex-1 pr-2">
              <h4 className="font-bold text-base tracking-tight leading-tight mb-1">{f.name}</h4>
              <span className="text-[10px] uppercase font-bold opacity-80">{f.country} • {f.type}{f.category ? ` • ${f.category}` : ''}</span>
              {(() => {
                const relDate = getRelevantDateForPinned(f);
                return relDate && (
                  <div className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-90 flex items-center gap-1.5">
                    <Hourglass className="h-3 w-3" />
                    {relDate.label}: {formatDisplayDate(relDate.date)}
                  </div>
                );
              })()}
            </div>
            {f.pinNote && (
              <div className="relative transform rotate-[4deg] hover:rotate-[1deg] transition-transform duration-300 w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex flex-col">
                <div className="absolute -top-2.5 inset-x-0 w-full flex justify-center z-20">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-red-500 shadow-sm border border-red-600 z-10"></div>
                    <div className="w-[1.5px] h-3 bg-slate-400 -mt-0.5"></div>
                  </div>
                </div>
                <div className="bg-[#fefce8] p-3 pt-4 rounded-sm shadow-md border-b border-r border-[#fef08a] relative z-10 flex-1 overflow-hidden">
                  <span className="block text-slate-800 text-[10px] sm:text-[11px] font-medium whitespace-pre-wrap font-mono leading-tight">{f.pinNote}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
