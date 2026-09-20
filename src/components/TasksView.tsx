import React from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { Search, Circle, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { Festival } from '../types';

interface TasksViewProps {
  festivals: Festival[];
  taskSearch: string;
  setTaskSearch: (v: string) => void;
  toggleTask: (festivalId: string, taskId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ festivals, taskSearch, setTaskSearch, toggleTask }) => {
  // Gather all tasks across all festivals
  const allTasks = festivals.flatMap(f => 
    (f.tasks || []).map(t => ({...t, festivalName: f.name, festivalId: f.id, status: f.status}))
  );
  
  // Filter by search
  const filteredTasks = allTasks.filter(t => 
    t.title.toLowerCase().includes(taskSearch.toLowerCase()) || 
    t.festivalName.toLowerCase().includes(taskSearch.toLowerCase()) ||
    (t.dueDate && t.dueDate.includes(taskSearch.toLowerCase()))
  );

  // split into pending
  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const today = new Date();

  return (
    <div className="space-y-6 pb-32 max-w-2xl mx-auto">
      <header className="flex flex-col gap-1 items-center mb-8">
        <h2 className="text-4xl font-light tracking-tight uppercase text-center"><span className="font-bold">Tareas</span></h2>
        <p className="text-slate-400 text-sm font-bold tracking-[0.2em] uppercase text-center">
          {pendingTasks.length} pendientes
        </p>
      </header>

      <div className="flex items-center gap-2 bg-white/60 rounded-xl px-4 py-3 border border-white/80 focus-within:border-pink-300 focus-within:bg-white transition-all shadow-sm">
         <Search className="h-4 w-4 text-[#e91e63]" />
         <input 
           type="text" 
           placeholder="Busca tareas por nombre, festival o fecha (YYYY-MM-DD)..." 
           className="bg-transparent w-full text-slate-700 focus:outline-none text-sm font-semibold placeholder:text-slate-400"
           value={taskSearch}
           onChange={(e) => setTaskSearch(e.target.value)}
         />
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Pendientes</h3>
        {pendingTasks.length === 0 && <p className="text-slate-400 italic text-sm text-center py-4">No hay tareas pendientes.</p>}
        {pendingTasks.map((task, idx) => {
           const daysDiff = task.dueDate ? differenceInDays(parseISO(task.dueDate), today) : null;
           const keyStr = `${task.festivalId}-${task.id || 'task'}-${idx}`;
           return (
            <div key={keyStr} className="bg-white p-4 rounded-2xl flex items-center justify-between group border border-slate-50 hover:border-pink-100 transition-all shadow-sm">
              <div 
                 className="flex items-center gap-4 cursor-pointer flex-1 mr-2"
                 onClick={() => toggleTask(task.festivalId, task.id)}
              >
                 <Circle className="h-5 w-5 text-slate-200 shrink-0" />
                 <div className="flex flex-col flex-1 min-w-0">
                   <span className="text-[8px] font-black tracking-widest text-slate-600 uppercase truncate max-w-[140px] mb-0.5">{task.festivalName}</span>
                   <span className="font-bold uppercase text-[11px] tracking-wide text-slate-600 break-words">{task.title}</span>
                   <div className="flex items-center gap-2 mt-1">
                     {task.dueDate && (
                       <span className="flex items-center gap-1 text-[8px] font-bold tracking-widest uppercase" style={{ color: '#b70069' }}>
                          <CalendarIcon className="h-3 w-3" /> {task.dueDate} 
                          {daysDiff !== null ? `(${daysDiff < 0 ? `Vencida hace ${Math.abs(daysDiff)} días` : daysDiff === 0 ? 'Vence hoy' : `Faltan ${daysDiff} días`})` : ''}
                       </span>
                     )}
                   </div>
                 </div>
              </div>
            </div>
           );
        })}
      </div>

      {completedTasks.length > 0 && (
        <div className="space-y-4 mt-8 opacity-60">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Completadas</h3>
          {completedTasks.map((task, idx) => (
            <div key={`completed-task-${task.festivalId || 'fest'}-${task.id || 'idx'}-${idx}`} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
              <div 
                 className="flex items-center gap-4 cursor-pointer flex-1 mr-2"
                 onClick={() => toggleTask(task.festivalId, task.id)}
              >
                 <CheckCircle2 className="h-5 w-5 text-[#c1668a] shrink-0" />
                 <div className="flex flex-col flex-1 min-w-0">
                   <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase truncate max-w-[140px] mb-0.5">{task.festivalName}</span>
                   <span className="font-bold uppercase text-[11px] tracking-wide text-slate-400 line-through break-words">{task.title}</span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
