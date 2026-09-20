import React, { useState } from 'react';
import { format } from 'date-fns';
import { Download, Upload, Trash2, Edit2, Check, User } from 'lucide-react';
import { BugTicket } from '../types';
import confetti from 'canvas-confetti';
import { cn } from '../utils/helpers';

interface BugTrackerProps {
  bugs: BugTicket[];
  setBugs: React.Dispatch<React.SetStateAction<BugTicket[]>>;
  showAlert: (msg: string) => void;
  addAuditLog?: (collection: string, details: string) => void;
  userName?: string;
  isAuthorized?: boolean;
}

export const BugTrackerView: React.FC<BugTrackerProps> = ({ bugs, setBugs, showAlert, addAuditLog, userName = 'Usuario', isAuthorized = false }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const exportBugs = () => {
    if (!isAuthorized) { showAlert("No tienes permisos."); return; }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bugs, null, 2));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `cardigan_bugs_${format(new Date(), 'yyyyMMdd_HHmm')}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showAlert("Bugs exportados correctamente.");
  };

  const importBugs = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthorized) { showAlert("No tienes permisos."); return; }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loaded = JSON.parse(event.target?.result as string);
        if (Array.isArray(loaded)) {
          setBugs(loaded);
          showAlert("Bugs importados correctamente.");
        } else {
          showAlert("Formato inválido.");
        }
      } catch (error) {
        showAlert("Error al leer el archivo.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const activeBugs = bugs.filter(b => b.status !== 'resolved').sort((a, b) => {
      const matchA = a.id.match(/^bug-\d+_(.+)$/);
      const matchB = b.id.match(/^bug-\d+_(.+)$/);
      const tsA = matchA ? parseInt(matchA[1], 10) : 0;
      const tsB = matchB ? parseInt(matchB[1], 10) : 0;
      return tsB - tsA;
  });

  const resolvedBugs = bugs.filter(b => b.status === 'resolved').sort((a, b) => {
      const matchA = a.id.match(/^bug-\d+_(.+)$/);
      const matchB = b.id.match(/^bug-\d+_(.+)$/);
      const tsA = matchA ? parseInt(matchA[1], 10) : 0;
      const tsB = matchB ? parseInt(matchB[1], 10) : 0;
      return tsB - tsA;
  });

  const sortedBugs = [...activeBugs, ...resolvedBugs];

  const handleStatusChange = (bugId: string, newStatus: string) => {
     if (newStatus === 'resolved') {
        confetti({
           particleCount: 100,
           spread: 70,
           origin: { y: 0.6 },
           colors: ['#10b981', '#34d399', '#059669']
        });
     }
     setBugs(bugs.map(b => b.id === bugId ? {...b, status: newStatus as any} : b));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Bug Tracker</h3>
          {isAuthorized && (
            <div className="flex items-center gap-3">
              <button onClick={exportBugs} className="text-slate-400 hover:text-[#e91e63] transition" title="Exportar JSON">
                <Download className="w-4 h-4"/>
              </button>
              <label className="text-slate-400 hover:text-[#e91e63] cursor-pointer transition" title="Importar JSON">
                <Upload className="w-4 h-4"/>
                <input type="file" accept=".json" className="hidden" onChange={importBugs} />
              </label>
              <button id="btn-add-bug"
                className="text-xs font-bold text-white bg-[#e91e63] px-3 py-1.5 rounded-lg hover:bg-pink-600 transition ml-2 shadow-md shadow-pink-200"
                onClick={async () => {
                  const maxTicket = bugs.reduce((max, b) => {
                     const match = b.id.match(/^bug-(\d+)_/);
                     const num = match ? parseInt(match[1], 10) : 0;
                     return num > max ? num : max;
                  }, 0);
                  const ticketNumber = maxTicket + 1;
                  const id = `bug-${ticketNumber}_${Date.now()}`;
                  const titleStr = 'Bug Encontrado';
                  const dateReported = format(new Date(), 'dd/MMM/yyyy').toLowerCase();
                  setBugs([{ id, title: titleStr, description: '', status: 'open', priority: 'medium', dateReported, author: userName }, ...bugs]);
                  setEditingId(id);
                  addAuditLog && addAuditLog('bugs', `${userName} ha reportado un nuevo bug: bug-${ticketNumber}`);

                  // Notify Devs asynchronously
                  try {
                    await fetch('/api/notify-bug', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: titleStr, description: '', author: userName })
                    });
                  } catch (e) {
                    console.error('Failed to notify bug to devs', e);
                  }
                }}
              >
                + Reportar Bug
              </button>
            </div>
          )}
      </div>
      {bugs.length === 0 ? (
          <div className="p-8 text-center bg-white/50 border border-slate-200/50 rounded-xl text-slate-500 font-medium text-sm">
            No hay bugs reportados 🎉
          </div>
      ) : (
          <div className="space-y-4">
            {sortedBugs.map((bug, idx) => {
              const isEditing = editingId === bug.id;
              const isResolved = bug.status === 'resolved';

              return (
                <div key={`${bug.id}-${idx}`} className={cn("bg-white px-4 pt-6 pb-4 md:p-4 md:pt-4 rounded-xl shadow-sm border-l-4 flex flex-col md:flex-row gap-4 relative group transition-all", isResolved ? "border-l-emerald-400 opacity-60 bg-slate-50/50" : "border-l-red-500")}>
                  <div className={cn("absolute top-0 left-0 font-black text-[9px] px-2 py-0.5 rounded-br-lg md:rounded-tl-none md:static md:rounded md:self-start md:mt-1", isResolved ? "bg-emerald-100 text-emerald-600 md:bg-emerald-50" : "bg-red-100 text-red-600 md:bg-slate-100 md:text-slate-400")}>
                    #{bug.id.match(/^bug-(\d+)_/)?.[1] || bug.id.slice(-4)}
                  </div>
                  
                  {isAuthorized && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      {isEditing ? (
                        <button className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition"
                          title="Guardar"
                          onClick={() => {
                             setEditingId(null);
                             addAuditLog && addAuditLog('bugs', `${userName} ha actualizado el bug: ${bug.title || bug.id}`);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      ) : (
                        <button className="p-1.5 bg-slate-100 text-slate-400 hover:text-red-500 rounded hover:bg-slate-200 transition"
                          title="Editar"
                          onClick={() => setEditingId(bug.id)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      )}
                      
                      <button className="p-1.5 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 rounded transition"
                        title="Eliminar"
                        onClick={() => {
                           setBugs(bugs.filter(b => b.id !== bug.id));
                           addAuditLog && addAuditLog('bugs', `${userName} ha eliminado el bug: ${bug.title || bug.id}`);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex-1 space-y-2 mt-4 md:mt-0">
                    <div className="flex items-center gap-2 pr-16 md:pr-16">
                      {isEditing ? (
                        <input className="font-bold text-[13px] text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-red-500 rounded p-1 w-[90%]"
                          value={bug.title}
                          onChange={(e) => setBugs(bugs.map(b => b.id === bug.id ? {...b, title: e.target.value} : b))}
                        />
                      ) : (
                        <h4 className={cn("font-bold text-[13px] text-slate-800", isResolved ? "line-through text-slate-500" : "")}>{bug.title}</h4>
                      )}
                    </div>
                    {isEditing ? (
                      <textarea className="text-xs text-slate-500 w-full bg-slate-50 p-2 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-red-500 mt-2" rows={2}
                        value={bug.description}
                        placeholder="Describe el error..."
                        onChange={(e) => setBugs(bugs.map(b => b.id === bug.id ? {...b, description: e.target.value} : b))}
                      />
                    ) : (
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">{(bug.description && bug.description.trim() !== '') ? bug.description : <span className="italic text-slate-500">Sin descripción</span>}</p>
                    )}
                    
                    <div className="flex items-center gap-1.5 pt-2">
                       <div className="h-5 w-5 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                          <User className="h-3 w-3 text-slate-600" />
                       </div>
                       <span className="text-[10px] font-bold text-slate-600 uppercase">{bug.author || 'Anónimo'}</span>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-48 flex flex-col gap-2">
                    {isEditing ? (
                      <>
                        <select className="text-xs font-bold bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
                          value={bug.status}
                          onChange={(e) => handleStatusChange(bug.id, e.target.value)}
                        >
                          <option value="open">Abierto</option>
                          <option value="in_progress">En Progreso</option>
                          <option value="resolved">Resuelto</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">Prio:</span>
                          <select className="flex-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
                            value={bug.priority}
                            onChange={(e) => setBugs(bugs.map(b => b.id === bug.id ? {...b, priority: e.target.value as any} : b))}
                          >
                            <option value="low">Baja</option>
                            <option value="medium">Media</option>
                            <option value="high">Alta</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`text-[10px] font-black uppercase text-center py-1 rounded w-full ${bug.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : bug.status === 'in_progress' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                           {bug.status === 'resolved' ? 'Resuelto' : bug.status === 'in_progress' ? 'En progreso' : 'Abierto'}
                        </div>
                        <div className={`text-[10px] font-black uppercase text-center py-1 rounded w-full border ${bug.priority === 'high' ? 'border-red-200 text-red-500 bg-white' : bug.priority === 'medium' ? 'border-amber-200 text-amber-500 bg-white' : 'border-slate-200 text-slate-500 bg-white'}`}>
                           Prioridad {bug.priority === 'high' ? 'Alta' : bug.priority === 'medium' ? 'Media' : 'Baja'}
                        </div>
                      </>
                    )}
                    <span className="text-[10px] text-slate-600 mt-auto text-right md:pt-4">Reportado: {bug.dateReported}</span>
                  </div>
                </div>
              );
            })}
          </div>
      )}
    </div>
  );
};
