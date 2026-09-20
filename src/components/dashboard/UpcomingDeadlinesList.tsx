import React from 'react';
import { Festival } from '../../types';
import { Bell, ChevronRight } from 'lucide-react';
import { formatDisplayDate, getStatusIcon } from '../../utils/helpers';

interface UpcomingDeadlinesListProps {
  upcomingDeadlines: Festival[];
  onSelectFestival: (f: Festival) => void;
}

export const UpcomingDeadlinesList: React.FC<UpcomingDeadlinesListProps> = ({ upcomingDeadlines, onSelectFestival }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
        <Bell className="h-4 w-4 text-[#e91e63]" /> Próximos Cierres ⏰ ({upcomingDeadlines.length})
      </h3>
      <div className="space-y-3">
        {upcomingDeadlines.map((f, idx) => (
          <div 
            key={`${f.id}-${idx}`} 
            onClick={() => onSelectFestival(f)}
            className="p-4 rounded-3xl cursor-pointer hover:bg-red-100/70 transition-all flex items-center justify-between bg-red-100/40 backdrop-blur-md border-[3px] border-[#d48585] text-red-800 shadow-sm shadow-red-100/50"
          >
            <div>
              <div className="flex items-center gap-2">
                 {getStatusIcon(f.status)}
                 <span className="text-[10px] uppercase font-bold">{f.status}</span>
              </div>
              <p className="font-black text-sm mt-1 leading-tight pr-4">{f.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">{f.deadline ? formatDisplayDate(f.deadline) : 'PENDIENTE'} • {f.country}</p>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50 shrink-0" />
          </div>
        ))}
        {upcomingDeadlines.length === 0 && (
          <div className="text-center py-6 glass-card border-dashed border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin cierres próximos registrados</p>
          </div>
        )}
      </div>
    </div>
  );
};
