import React, { useState } from 'react';
import { Festival, FestivalStatus, Task, StatusHistoryEntry, Reminder, DistributionPlan } from '../types';
import { ChevronRight, Edit2, Trash2, Globe, Calendar as CalendarIcon, ExternalLink, Projector, User, Plus, CheckCircle2, Circle, Pin, PinOff, Archive, ArchiveRestore, History, Clock, RefreshCw, Copy, Check, CheckSquare, FileText, Layers, Link2, FlaskConical, Bell, Building, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getStatusColorStyles, getStatusIcon, formatDisplayDate } from '../utils/helpers';
import { ChangeStatusModal } from './ChangeStatusModal';

interface FestivalDetailsViewProps {
  festival?: Festival | null;
  isAuthorized: boolean;
  setView: (v: string) => void;
  previousView?: string;
  setModalType: (t: 'create' | 'edit' | 'new_edition') => void;
  setIsModalOpen: (v: boolean) => void;
  handleDeleteFestival: (id: string) => void;
  setPromptConfig: (config: any) => void;
  setConfirmConfig: (config: any) => void;
  handleAddTask: (festId: string, title: string) => void;
  handleEditTask: (festId: string, taskId: string, title: string) => void;
  handleConfigTaskDeadline: (festId: string, taskId: string, dateStr: string) => void;
  handleDeleteTask: (festId: string, taskId: string) => void;
  toggleTask: (festId: string, taskId: string) => void;
  handleUpdatePin: (festId: string, isPinned: boolean, pinNote?: string) => void;
  handleArchiveFestival?: (festId: string, archive: boolean) => void;
  handleUpdateStatus?: (id: string, newStatus: FestivalStatus, note?: string) => void;
  showToast?: (msg: string) => void;
  festivals?: Festival[];
  distributionPlans?: DistributionPlan[];
  setSelectedFestival?: (f: Festival | null) => void;
  onUpdateFestival?: (f: Festival) => void;
  isDebugMode?: boolean;
  reminders?: Reminder[];
  setEditingReminder?: (rem: Reminder | null) => void;
  setIsReminderModalOpen?: (open: boolean) => void;
  deleteReminder?: (id: string) => void;
}

const TEST_VECTOR_LAUREL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 350" width="500" height="350"><g fill="%23000000"><path d="M170,310 C130,260 100,180 110,100 C113,70 120,40 135,10 C125,35 118,65 115,95 C102,175 130,255 170,310 Z"/><path d="M120,30 C100,20 70,25 50,40 C70,45 95,45 115,35 Z"/><path d="M110,60 C85,50 55,55 35,75 C58,78 85,72 105,62 Z"/><path d="M102,95 C75,90 45,100 25,120 C50,118 78,110 98,98 Z"/><path d="M98,130 C70,130 42,142 25,165 C50,158 78,145 95,132 Z"/><path d="M100,165 C75,170 50,188 35,215 C58,202 84,185 100,168 Z"/><path d="M108,200 C85,210 62,232 50,260 C72,242 98,220 112,202 Z"/><path d="M122,235 C102,250 82,275 75,305 C95,282 118,258 128,238 Z"/><path d="M330,310 C370,260 400,180 390,100 C387,70 380,40 365,10 C375,35 382,65 385,95 C398,175 370,255 330,310 Z"/><path d="M380,30 C400,20 430,25 450,40 C430,45 405,45 385,35 Z"/><path d="M390,60 C415,50 445,55 465,75 C442,78 415,72 395,62 Z"/><path d="M398,95 C425,90 455,100 475,120 C450,118 422,110 402,98 Z"/><path d="M402,130 C430,130 458,142 475,165 C450,158 422,145 405,132 Z"/><path d="M400,165 C425,170 450,188 465,215 C442,202 416,185 400,168 Z"/><path d="M392,200 C415,210 438,232 450,260 C428,242 402,220 388,202 Z"/><path d="M378,235 C398,250 418,275 425,305 C405,282 382,258 372,238 Z"/></g><text x="250" y="110" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="18" letter-spacing="2" fill="%23000000">2026 OFFICIAL SELECTION</text><line x1="170" y1="125" x2="330" y2="125" stroke="%23000000" stroke-width="2"/><text x="250" y="170" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="28" letter-spacing="1" fill="%23000000">TEST FESTIVAL</text><text x="250" y="215" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="36" letter-spacing="2" fill="%23000000">2026</text></svg>`;

const formatFestivalInfoForCopy = (fest: Festival): string => {
  const tasksList = (fest.tasks || [])
    .map((t) => `  ${t.completed ? '[X]' : '[ ]'} ${t.title}${t.dueDate ? ` (Cierre: ${formatDisplayDate(t.dueDate)})` : ''}`)
    .join('\n');

  const historyList = (fest.statusHistory || [])
    .slice()
    .reverse()
    .map((h) => {
      const dateStr = h.timestamp
        ? new Date(h.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
        : '';
      return `  - ${h.status}${h.previousStatus ? ` (Antes: ${h.previousStatus})` : ''}${h.note ? `: "${h.note}"` : ''} ${dateStr ? `[${dateStr}]` : ''}`;
    })
    .join('\n');

  return `🎬 INFORMACIÓN DEL FESTIVAL 🎬
----------------------------------------
📌 Festival: ${fest.name || 'Sin Nombre'}
📍 País/Ubicación: ${fest.country || 'No especificado'}
🏷️ Tipo: ${fest.type || 'N/A'}
📊 Estado Actual: ${fest.status || 'N/A'}
⏰ Cierre / Deadline: ${fest.deadline ? formatDisplayDate(fest.deadline) : 'Sin fecha'}
📢 Noticia / Anuncio: ${fest.newsDate ? formatDisplayDate(fest.newsDate) : 'N/A'}
🌐 Plataforma: ${fest.platform || 'N/A'}
📁 Categoría: ${fest.category || 'N/A'}
💵 Fee / Costo: ${fest.price || 'GRATIS'}
🏆 Nominación: ${fest.nomination || 'N/A'}
🆔 ID Timecode: ${fest.id || 'N/A'}
👤 Registrado por: ${fest.createdBy || 'Sistema'}
${fest.isPinned ? `📌 Pin Note: ${fest.pinNote || 'Pineado'}\n` : ''}${fest.archived ? `📁 Estado: ARCHIVADO\n` : ''}${fest.projectionDate || fest.projectionLocation ? `🎥 Proyección: ${fest.projectionDate ? formatDisplayDate(fest.projectionDate) : ''} (${fest.projectionLocation || 'Sin locación'})\n` : ''}${fest.link ? `🔗 Web Oficial: ${fest.link}\n` : ''}
📝 Observaciones / Requisitos:
${fest.observations ? fest.observations : 'Sin observaciones registradas.'}

${tasksList ? `✅ Checklist de Tareas:\n${tasksList}\n` : ''}${historyList ? `📜 Historial de Estado Reciente:\n${historyList}\n` : ''}----------------------------------------
Copiado desde Festis App`;
};

export const FestivalDetailsView: React.FC<FestivalDetailsViewProps> = ({
  festival: f, isAuthorized, setView, previousView, setModalType, setIsModalOpen, handleDeleteFestival,
  setPromptConfig, setConfirmConfig, handleAddTask, handleEditTask,
  handleConfigTaskDeadline, handleDeleteTask, toggleTask, handleUpdatePin, handleArchiveFestival,
  handleUpdateStatus, showToast, isDebugMode, festivals, distributionPlans, setSelectedFestival, onUpdateFestival,
  reminders = [], setEditingReminder, setIsReminderModalOpen, deleteReminder
}) => {
  const updateTestFestival = (changes: Partial<Festival>, toastMsg?: string) => {
    const updated = { ...f, ...changes };
    if (onUpdateFestival) {
      onUpdateFestival(updated);
    } else if (setSelectedFestival) {
      setSelectedFestival(updated);
    }
    if (toastMsg) showToast?.(toastMsg);
  };

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isNewEditionConfirmOpen, setIsNewEditionConfirmOpen] = useState(false);
  const [newEditionConfirmChecked, setNewEditionConfirmChecked] = useState(false);

  // Recordatorios vinculados específicamente a este festival
  const linkedReminders = React.useMemo(() => {
    if (!reminders || !f?.id) return [];
    return reminders.filter((r) => r.festivalId === f.id);
  }, [reminders, f?.id]);

  // Obtener todas las ediciones vinculadas en la cadena histórica del festival
  const linkedEditions = React.useMemo(() => {
    if (!festivals || festivals.length === 0 || !f?.id) return [];
    
    const chain = new Set<string>();
    
    // Trazar hacia atrás por previousEditionId
    let curr: Festival | undefined = f;
    while (curr) {
      if (curr.previousEditionId) {
        chain.add(curr.previousEditionId);
        curr = festivals.find((item) => item.id === curr?.previousEditionId);
      } else {
        break;
      }
    }

    // Trazar hacia adelante por relaciones directas
    let added = true;
    while (added) {
      added = false;
      for (const fest of festivals) {
        if (fest.previousEditionId && (chain.has(fest.previousEditionId) || fest.previousEditionId === f.id) && !chain.has(fest.id)) {
          chain.add(fest.id);
          added = true;
        }
      }
    }

    // Trazar coincidencia de nombre base
    const cleanBaseName = (f.name || '').replace(/\s*\b(19|20)\d{2}\b/g, '').trim().toLowerCase();
    if (cleanBaseName.length > 3) {
      festivals.forEach((fest) => {
        const festBaseName = (fest.name || '').replace(/\s*\b(19|20)\d{2}\b/g, '').trim().toLowerCase();
        if (festBaseName === cleanBaseName) {
          chain.add(fest.id);
        }
      });
    }

    return festivals
      .filter((item) => chain.has(item.id) && item.id !== f.id)
      .sort((a, b) => ((b.editionYear || (b as any).year || 0) - (a.editionYear || (a as any).year || 0)));
  }, [f, festivals]);

  const handleCopyInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!f) return;

    const textToCopy = formatFestivalInfoForCopy(f);
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      if (showToast) {
        showToast("Información del festival copiada al portapapeles.");
      }
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }).catch(() => {
      if (showToast) {
        showToast("Error al copiar información.");
      }
    });
  };

  const getBackLabel = () => {
    if (!previousView) return "Volver a la lista";
    switch (previousView) {
      case 'stats': return "Volver a Estadísticas";
      case 'calendar': return "Volver al Calendario";
      case 'dashboard': return "Volver al Dashboard";
      case 'tasks': return "Volver a Tareas";
      case 'planning': return "Volver a Planificación";
      case 'distribution_plan_detail': return "Volver al Plan de Distribución";
      case 'distribution_plans': return "Volver a Planes de Distribución";
      default: return "Volver a la lista";
    }
  };

  if (!f) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
        <p className="text-slate-600 font-bold text-base">
          El festival seleccionado no se encuentra disponible.
        </p>
        <button
          onClick={() => setView(previousView || "festivals")}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all hover:bg-slate-800 shadow-sm"
        >
          {getBackLabel()}
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={`fest-detail-view-${f.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        className={cn(
          "space-y-8 pb-32 transition-all duration-500 relative",
          f.archived ? "border-2 sm:border-4 border-slate-800 rounded-[2rem] p-4 sm:p-8 bg-slate-50/50 mt-8" : "mt-0"
        )}
      >
      <AnimatePresence>
        {f.archived && (
          <motion.div 
            key="fest-archived-banner"
            initial={{ opacity: 0, y: -20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -20, scale: 0.9 }} 
            className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-2 rounded-full font-black tracking-widest text-sm hidden sm:flex items-center gap-2 shadow-xl z-50 whitespace-nowrap"
          >
            <Archive className="h-5 w-5 text-slate-300" /> Festival archivado
          </motion.div>
        )}
      </AnimatePresence>
      <header className="flex items-center justify-between">
        <button
          id="btn-back-to-list"
          onClick={() => setView(previousView || 'festivals')}
          className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-[#e91e63] border border-slate-100 transition-colors"
          title={getBackLabel()}
        >
          <ChevronRight className="h-6 w-6 rotate-180" />
        </button>
        <div className="flex gap-2">
          {isAuthorized && (
            <>
              {/* Botón Pinear / Despinear (Ámbar) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (f.isPinned) {
                    handleUpdatePin(f.id, false);
                  } else {
                    setPromptConfig({
                      isOpen: true,
                      title: "Anota algo en el Pin (Opcional)",
                      value: "",
                      onSubmit: (val: string) => {
                        handleUpdatePin(f.id, true, val);
                      },
                    });
                  }
                }}
                className={cn(
                  "h-12 w-12 rounded-2xl shadow-sm flex items-center justify-center transition-all",
                  f.isPinned ? "bg-amber-100 text-amber-600 border border-amber-200 hover:bg-amber-200" : "bg-white text-amber-500 border border-amber-100 hover:bg-amber-50"
                )}
                title={f.isPinned ? "Despinear Festival" : "Pinear Festival"}
              >
                {f.isPinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
              </button>
              
              {/* Botón Archivar / Desarchivar (Gris / Slate) */}
              <button
                type="button"
                onClick={() => {
                  if (handleArchiveFestival) {
                    handleArchiveFestival(f.id, !f.archived);
                  }
                }}
                className={cn(
                  "h-12 w-12 rounded-2xl shadow-sm flex items-center justify-center transition-all",
                  f.archived ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-100"
                )}
                title={f.archived ? "Desarchivar Festival" : "Archivar Festival"}
              >
                {f.archived ? <ArchiveRestore className="h-5 w-5" /> : <Archive className="h-5 w-5" />}
              </button>

              {/* Botón Copiar Información (Índigo / Esmeralda) */}
              <button
                id="btn-copy-festival-info"
                type="button"
                onClick={handleCopyInfo}
                className={cn(
                  "h-12 w-12 rounded-2xl shadow-sm flex items-center justify-center transition-all border",
                  copied
                    ? "bg-emerald-500 text-white border-emerald-500 scale-105"
                    : "bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
                )}
                title="Copiar información completa del festival para compartir o IA"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>

              {/* Botón Nueva Edición (Esmeralda / Teal) - Solo visible si la edición previa ha concluido o cerrado (no en 'Por enviar', 'En revisión' o 'Seleccionado') */}
              {f.status !== FestivalStatus.POR_ENVIAR && 
               f.status !== FestivalStatus.EN_REVISION && 
               f.status !== FestivalStatus.SELECCIONADO && (
                <button
                  id="btn-new-edition"
                  type="button"
                  onClick={() => {
                    setNewEditionConfirmChecked(false);
                    setIsNewEditionConfirmOpen(true);
                  }}
                  className="h-12 px-3.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm hover:bg-emerald-100 hover:text-emerald-800 transition-all flex items-center justify-center gap-1.5 font-bold text-xs"
                  title="Abrir nueva edición de este festival"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden md:inline">Nueva edición</span>
                </button>
              )}

              {/* Botón Editar (Solo ícono - Fucsia / Pink) */}
              <button id="btn-edit-festival"
                onClick={() => { 
                  setModalType('edit'); 
                  setIsModalOpen(true); 
                }}
                className="h-12 w-12 rounded-2xl bg-white text-[#e91e63] border border-pink-100 shadow-sm hover:bg-pink-50 hover:border-pink-200 hover:text-[#c2185b] transition-all flex items-center justify-center"
                title="Editar datos del festival"
              >
                <Edit2 className="h-5 w-5" />
              </button>

              {/* Botón Eliminar (Rojo) */}
              <button id="btn-delete-festival" onClick={() => handleDeleteFestival(f.id)} className="h-12 w-12 rounded-2xl bg-white text-rose-500 shadow-sm border border-rose-100 flex items-center justify-center hover:bg-rose-50 transition-all" title="Eliminar festival">
                <Trash2 className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest bg-[#e91e63] text-white px-3 py-1 rounded-full shadow-lg shadow-[#e91e63]/20">{f.type}</span>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest border px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5",
              getStatusColorStyles(f.status)
            )}>
              {getStatusIcon(f.status)}
              {f.status}
            </span>
            {f.isTestFestival && (
              <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                <FlaskConical className="w-3 h-3 text-indigo-200" />
                MODO TEST
              </span>
            )}
            {f.includeInStats === false ? (
              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-600 text-white px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1" title="Excluido de las métricas y estadísticas de la app">
                📊 Excluido de Stats
              </span>
            ) : (isDebugMode || f.isTestFestival) ? (
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1" title="Contabilizado en las métricas e informes de la app">
                📊 Incluido en Stats
              </span>
            ) : null}
        </div>
        {f.laurel && (
          <div className="py-2">
            <img src={f.laurel} alt="Laurel" className="h-24 object-contain rounded-[15px] p-2" style={{ backgroundColor: f.laurelBg === 'white' ? '#ffffff' : f.laurelBg === 'black' ? '#000000' : 'transparent' }} />
          </div>
        )}
        <h1 className="text-4xl font-black tracking-tighter leading-tight text-slate-800">{f.name}</h1>
        <div className="flex gap-2 flex-wrap items-center">
           <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black italic bg-slate-100/80 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-sm w-fit">
             <Globe className="h-3.5 w-3.5 text-[#e91e63]" /> {f.country}
           </p>

           {f.previousEditionId && (
             <button
               type="button"
               onClick={() => {
                 const prev = festivals?.find(item => item.id === f.previousEditionId);
                 if (prev && setSelectedFestival) {
                   setSelectedFestival(prev);
                   window.scrollTo({ top: 0, behavior: 'smooth' });
                 }
               }}
               className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
             >
               <Link2 className="h-3.5 w-3.5 text-emerald-600" />
               Edición previa: <span className="underline font-black">{festivals?.find(item => item.id === f.previousEditionId)?.name || 'Anterior'}</span>
             </button>
           )}
        </div>
      </div>

      {/* Herramientas de Testeo (Visibles si Debug Mode está activo o es Festival de Prueba) */}
      {(isDebugMode || f.isTestFestival) && (
        <div className="p-3.5 rounded-2xl bg-indigo-950/90 border-2 border-indigo-500/40 text-indigo-100 shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 text-indigo-300">
              <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
              Herramientas de Testeo Interactivo
            </span>
            <span className="text-[9px] bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded font-black tracking-widest uppercase">
              MODO TEST
            </span>
          </div>

          <div className="space-y-2 text-[10px]">
            {/* Fila 1: Cambio rápido de estados */}
            <div>
              <p className="text-[9px] font-extrabold uppercase text-indigo-300 tracking-wider mb-1">1. Probar Cambios de Estado:</p>
              <div className="flex flex-wrap gap-1">
                {Object.values(FestivalStatus).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      if (handleUpdateStatus) {
                        handleUpdateStatus(f.id, st, `Test: Forzado a ${st}`);
                      } else {
                        updateTestFestival({ status: st }, `Estado cambiado a ${st}`);
                      }
                    }}
                    className={cn(
                      "px-2 py-1 rounded-md font-bold transition-all border text-[9px] cursor-pointer",
                      f.status === st
                        ? "bg-indigo-500 text-white border-indigo-300 shadow-xs"
                        : "bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 border-indigo-700/60"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Fila 2: Plazos y Fechas */}
            <div>
              <p className="text-[9px] font-extrabold uppercase text-indigo-300 tracking-wider mb-1">2. Probar Plazos y Noticia:</p>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    updateTestFestival({ deadline: today }, "Cierre fijado para HOY");
                  }}
                  className="px-2 py-1 rounded-md bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 font-bold cursor-pointer"
                >
                  📅 Cierre HOY
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toISOString().split('T')[0];
                    updateTestFestival({ deadline: yesterdayStr }, "Cierre fijado para AYER (auto-cierre)");
                  }}
                  className="px-2 py-1 rounded-md bg-amber-900/80 hover:bg-amber-800 text-amber-100 border border-amber-700 font-bold cursor-pointer"
                >
                  🔒 Cierre AYER
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d3 = new Date();
                    d3.setDate(d3.getDate() + 3);
                    updateTestFestival({ deadline: d3.toISOString().split('T')[0] }, "Cierre fijado en +3 días");
                  }}
                  className="px-2 py-1 rounded-md bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 font-bold cursor-pointer"
                >
                  ⏳ Cierre +3 Días
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d7 = new Date();
                    d7.setDate(d7.getDate() + 7);
                    updateTestFestival({ newsDate: d7.toISOString().split('T')[0] }, "Anuncio de Noticia fijado en +7 días");
                  }}
                  className="px-2 py-1 rounded-md bg-sky-900/80 hover:bg-sky-800 text-sky-100 border border-sky-700 font-bold cursor-pointer"
                >
                  📢 Noticia +7 Días
                </button>
              </div>
            </div>

            {/* Fila 3: Laureles, Pin, Archivo y Datos de Prueba */}
            <div>
              <p className="text-[9px] font-extrabold uppercase text-indigo-300 tracking-wider mb-1">3. Probar Laureles Vectoriales y Datos:</p>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => {
                    updateTestFestival({ laurel: TEST_VECTOR_LAUREL, laurelBg: "white" }, "🎨 Laurel Vectorial Test 2026 cargado (Fondo Blanco)");
                  }}
                  className="px-2 py-1 rounded-md bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 font-bold cursor-pointer"
                >
                  🎨 Laurel Vectorial Blanco
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateTestFestival({ laurel: TEST_VECTOR_LAUREL, laurelBg: "black" }, "🏆 Laurel Vectorial Test 2026 cargado (Fondo Negro)");
                  }}
                  className="px-2 py-1 rounded-md bg-yellow-900/80 hover:bg-yellow-800 text-yellow-100 border border-yellow-700 font-bold cursor-pointer"
                >
                  🏆 Laurel Vectorial Negro
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateTestFestival({ laurel: undefined }, "Laurel removido");
                  }}
                  className="px-2 py-1 rounded-md bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 font-bold cursor-pointer"
                >
                  ❌ Quitar Laurel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdatePin(f.id, !f.isPinned, f.isPinned ? undefined : "Pin de testeo");
                  }}
                  className="px-2 py-1 rounded-md bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 font-bold cursor-pointer"
                >
                  📌 {f.isPinned ? "Quitar Pin" : "Pinear"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleArchiveFestival?.(f.id, !f.archived);
                  }}
                  className="px-2 py-1 rounded-md bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 font-bold cursor-pointer"
                >
                  📦 {f.archived ? "Desarchivar" : "Archivar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newCountry = f.country === "Francia" ? "Argentina" : "Francia";
                    updateTestFestival({ country: newCountry }, `País de sede cambiado a ${newCountry}`);
                  }}
                  className="px-2 py-1 rounded-md bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 font-bold cursor-pointer"
                >
                  🌐 Cambiar País ({f.country})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newPrice = f.price === "Gratis" ? "$35 USD" : "Gratis";
                    const newFee = newPrice === "Gratis" ? 0 : 35;
                    updateTestFestival({ price: newPrice, fee: newFee }, `Fee del festival actualizado a ${newPrice}`);
                  }}
                  className="px-2 py-1 rounded-md bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 font-bold cursor-pointer"
                >
                  💵 Cambiar Fee ({f.price})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAddTask(f.id, `🧪 Tarea de testeo #${(f.tasks?.length || 0) + 1}`);
                  }}
                  className="px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400 font-bold cursor-pointer"
                >
                  ➕ Agregar Tarea
                </button>
              </div>
            </div>

            {/* Fila 4: Contabilización en Métricas/Stats y Simulaciones */}
            <div>
              <p className="text-[9px] font-extrabold uppercase text-indigo-300 tracking-wider mb-1">4. Contabilización en Stats y Simulaciones:</p>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const newInc = !(f.includeInStats !== false);
                    updateTestFestival({ includeInStats: newInc }, newInc ? "✅ Festival INCLUIDO en métricas y stats" : "🚫 Festival EXCLUIDO de métricas y stats");
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-bold transition-all border text-[9px] cursor-pointer flex items-center gap-1",
                    f.includeInStats !== false
                      ? "bg-emerald-600 text-white border-emerald-400 shadow-xs"
                      : "bg-amber-600 text-white border-amber-400 shadow-xs"
                  )}
                >
                  📊 Medición en Stats: {f.includeInStats !== false ? "INCLUIDO" : "EXCLUIDO"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateTestFestival({
                      projectionDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
                      projectionLocation: "Cine Gaumont - Sala 1, Buenos Aires",
                      projectionLat: -34.6128,
                      projectionLng: -58.3812,
                    }, "📍 Proyección en Mapa configurada (Cine Gaumont)");
                  }}
                  className="px-2 py-1 rounded-md bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 font-bold cursor-pointer"
                >
                  📍 Proyección Mapa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newObs = (f.observations || "") + `\n[TEST ${new Date().toLocaleTimeString()}] Observación de prueba registrada.`;
                    updateTestFestival({ observations: newObs }, "💬 Observación de testeo agregada");
                  }}
                  className="px-2 py-1 rounded-md bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 font-bold cursor-pointer"
                >
                  💬 Agregar Observación
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateTestFestival({
                      status: FestivalStatus.POR_ENVIAR,
                      laurel: undefined,
                      price: "Gratis",
                      fee: 0,
                      includeInStats: false,
                      tasks: [],
                      deadline: undefined,
                      newsDate: undefined,
                      projectionDate: undefined,
                      projectionLocation: undefined,
                    }, "🔄 Festival reseteado a estado inicial de prueba");
                  }}
                  className="px-2 py-1 rounded-md bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-700 font-bold cursor-pointer"
                >
                  🔄 Resetear Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className={cn("p-3 border shadow-sm rounded-2xl", getStatusColorStyles(f.status))}>
          <p className="text-[8px] uppercase font-black tracking-widest mb-0.5 opacity-60">Cierre</p>
          <p className="text-xs font-black opacity-90">{f.deadline ? formatDisplayDate(f.deadline) : 'PENDIENTE'}</p>
        </div>
        <div className={cn("p-3 border shadow-sm rounded-2xl", getStatusColorStyles(f.status))}>
          <p className="text-[8px] uppercase font-black tracking-widest mb-0.5 opacity-60">Noticia</p>
          <p className="text-xs font-black opacity-90">{f.newsDate ? formatDisplayDate(f.newsDate) : '—'}</p>
        </div>
        <div className={cn("p-3 border shadow-sm rounded-2xl", getStatusColorStyles(f.status))}>
          <p className="text-[8px] uppercase font-black tracking-widest mb-0.5 opacity-60">Plataforma</p>
          <p className="text-xs font-black uppercase tracking-tight break-words opacity-90 leading-tight">{f.platform || 'N/A'}</p>
        </div>
        <div className={cn("p-3 border shadow-sm rounded-2xl", getStatusColorStyles(f.status))}>
          <p className="text-[8px] uppercase font-black tracking-widest mb-0.5 opacity-60">Fee</p>
          <p className="text-xs font-black opacity-90">{f.price || 'GRATIS'}</p>
        </div>
        <div className={cn("p-3 border shadow-sm rounded-2xl", getStatusColorStyles(f.status))}>
          <p className="text-[8px] uppercase font-black tracking-widest mb-0.5 opacity-60">Subido por</p>
          <p className="text-xs font-black flex items-center gap-1 opacity-90"><User className="h-3 w-3" /> {f.createdBy || 'Sistema'}</p>
        </div>
        <div className={cn("p-3 border shadow-sm rounded-2xl", getStatusColorStyles(f.status))}>
          <p className="text-[8px] uppercase font-black tracking-widest mb-0.5 opacity-60">ID FESTIVAL</p>
          <p className="text-xs font-black font-mono opacity-90 truncate">{f.id}</p>
        </div>
        <div className={cn("p-3 border shadow-sm rounded-2xl col-span-2", getStatusColorStyles(f.status))}>
          <p className="text-[8px] uppercase font-black tracking-widest mb-0.5 opacity-60">Categoría</p>
          <p className="text-xs font-black break-words opacity-90 leading-tight">{f.category || 'N/A'}</p>
        </div>
        <div className={cn("p-3 border shadow-sm rounded-2xl", getStatusColorStyles(f.status))}>
          <p className="text-[8px] uppercase font-black tracking-widest mb-0.5 opacity-60">Nominación</p>
          <p className="text-xs font-black break-words opacity-90 leading-tight">{f.nomination || '—'}</p>
        </div>
      </div>

      {(f.projectionDate || f.projectionLocation) && (
        <div 
            onClick={() => {
              if (f.projectionLocation) {
                  window.open(`https://maps.google.com/?q=${encodeURIComponent(f.projectionLocation)}`, '_blank');
              }
            }}
            className={cn("bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border-l-8 border-l-amber-400 transition-all", f.projectionLocation ? "cursor-pointer hover:scale-[1.02] hover:bg-slate-50" : "")}
        >
          <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Proyección 🎥</span>
            {f.projectionLocation && <span className="opacity-50 hover:opacity-100"><ExternalLink className="h-3 w-3" /></span>}
          </h4>
          <div className="flex items-center gap-5 mt-4">
            <div className="bg-amber-100/50 p-4 rounded-full shrink-0">
              <Projector className="h-8 w-8 text-amber-500" />
            </div>
            <div className="flex flex-col">
              <p className="text-2xl font-black text-slate-800 leading-none">{formatDisplayDate(f.projectionDate)}</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">{f.projectionLocation || 'Sin locación'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BANNER UNIFICADO OFICIAL: PLAN DE DISTRIBUCIÓN               */}
      {/* ============================================================ */}
      {(f.isPreliminary || f.distributionPlanId || f.distributionPlanName || f.esBorradorPlan) && (() => {
        const matchedPlan = distributionPlans?.find((p) => p.id === f.distributionPlanId);
        const planNombre = f.distributionPlanName || matchedPlan?.nombre || "Plan de Distribución";
        const institucion = f.institucionNombre || matchedPlan?.institucionNombre || "Institución Reguladora";
        const planId = f.distributionPlanId || matchedPlan?.id || "-";
        
        // Estado formal del plan
        const rawStatus = matchedPlan?.estado;
        const isAprobado = rawStatus === "aprobado" || Boolean(f.fechaAprobacionInstitucional);
        const isEnRevision = rawStatus === "en_revision" || rawStatus === "pendiente";
        const isNoAprobado = rawStatus === "no_aprobado";
        const isArchivado = rawStatus === "archivado";
        
        const statusLabel = isAprobado
          ? "Aprobado Formalmente"
          : isEnRevision
          ? "En Revisión Técnica"
          : isNoAprobado
          ? "No Aprobado"
          : isArchivado
          ? "Archivado"
          : "Borrador en Formulación";

        const statusBadgeClasses = isAprobado
          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
          : isEnRevision
          ? "bg-sky-100 text-sky-800 border-sky-200"
          : isNoAprobado
          ? "bg-rose-100 text-rose-800 border-rose-200"
          : isArchivado
          ? "bg-slate-200 text-slate-700 border-slate-300"
          : "bg-amber-100 text-amber-800 border-amber-200";

        const borderAccentClass = isAprobado
          ? "border-l-emerald-500"
          : isEnRevision
          ? "border-l-sky-500"
          : isNoAprobado
          ? "border-l-rose-500"
          : isArchivado
          ? "border-l-slate-400"
          : "border-l-amber-500";

        return (
          <div className={cn(
            "bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm border-l-4 space-y-3.5 transition-all",
            borderAccentClass
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "p-2 rounded-xl shrink-0",
                  isAprobado ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                )}>
                  {isAprobado ? <ShieldCheck className="h-5 w-5" /> : <Building className="h-5 w-5" />}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Plan de Distribución
                  </span>
                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    {planNombre}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {f.esBorradorPlan && (
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Borrador de Plan
                  </span>
                )}
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs flex items-center gap-1.5",
                  statusBadgeClasses
                )}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* Fila de Datos Dinámicos: Nombre, Institución, ID, Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Institución Reguladora
                </span>
                <p className="font-black text-slate-800 truncate">
                  {institucion}
                </p>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  ID Expediente / Plan
                </span>
                <p className="font-mono font-bold text-slate-700 truncate text-[11px]">
                  {planId}
                </p>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Estado Formal
                </span>
                <p className="font-black text-slate-800 truncate">
                  {statusLabel}
                </p>
              </div>
            </div>

            {f.fechaAprobacionInstitucional && (
              <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50/60 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>
                  Aprobación registrada el {new Date(f.fechaAprobacionInstitucional).toLocaleDateString("es-AR")}
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {f.link && (
        <a 
          href={f.link.startsWith('http') ? f.link : `https://${f.link}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 bg-[#e91e63] text-white rounded-2xl font-black uppercase text-xs tracking-[0.25em] hover:bg-[#c2185b] transition-all shadow-md hover:shadow-lg cursor-pointer"
        >
          <ExternalLink className="h-5 w-5" /> LINK
        </a>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
            <CheckSquare className="h-4 w-4 text-slate-900" />
            Checklist de seguimiento
          </h3>
          {isAuthorized && (
            <button id="btn-add-task-checklist"
              onClick={() => {
                setPromptConfig({ isOpen: true, title: 'Nueva tarea:', value: '', onSubmit: (title: string) => {
                  if (title) handleAddTask(f.id, title);
                }});
              }}
              className="px-3 py-1.5 rounded-lg border-2 border-[#e91e63] text-[#e91e63] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[#e91e63] hover:text-white transition-all shadow-sm flex items-center gap-1"
            ><Plus className="h-3 w-3" /> AÑADIR</button>
          )}
        </div>
        <div className="space-y-2">
          {f.tasks?.map((task: Task, idx: number) => (
            <div 
              key={`fest-task-${f.id}-${task.id || 't'}-${idx}`} 
              className="bg-white p-4 rounded-2xl flex items-center justify-between group border border-slate-50 hover:border-pink-100 transition-all"
            >
              <div 
                  className={cn("flex items-center gap-4 flex-1 mr-2", isAuthorized ? "cursor-pointer" : "cursor-default")}
                  onClick={() => isAuthorized && toggleTask(f.id, task.id)}
              >
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-[#c1668a] shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-200 shrink-0" />
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={cn("font-bold uppercase text-[10px] tracking-wide break-words", task.completed ? "line-through text-slate-300" : "text-slate-600")}>{task.title}</span>
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-[8px] font-bold tracking-widest uppercase mt-0.5" style={{ color: '#991278' }}><CalendarIcon className="h-3 w-3" /> Cierre: {formatDisplayDate(task.dueDate)}</span>
                    )}
                  </div>
              </div>
              {isAuthorized && (
                <div className="flex gap-2">
                    <button id={`btn-auto-15-${task.id}`} 
                      onClick={(e) => {
                          e.stopPropagation();
                          setPromptConfig({ isOpen: true, title: 'Editar tarea:', value: task.title, onSubmit: (newT: string) => {
                            if (newT) handleEditTask(f.id, task.id, newT);
                          }});
                      }}
                      className="text-[#707070] hover:scale-110 transition-transform"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button id={`btn-auto-16-${task.id}`} 
                      onClick={(e) => {
                          e.stopPropagation();
                          setPromptConfig({ isOpen: true, title: 'Configurar Fecha Límite:', inputType: 'date', value: task.dueDate || '', onSubmit: (dateStr: string) => {
                            handleConfigTaskDeadline(f.id, task.id, dateStr);
                          }});
                      }}
                      className="text-[#707070] hover:scale-110 transition-transform"
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </button>
                    <button id={`btn-auto-17-${task.id}`} 
                      onClick={(e) => {
                          e.stopPropagation();
                          setConfirmConfig({ isOpen: true, title: '¿Borrar tarea?', onConfirm: () => handleDeleteTask(f.id, task.id) });
                      }}
                      className="text-[#707070] hover:scale-110 transition-transform hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Observaciones técnicas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
            <FileText className="h-4 w-4 text-slate-900" />
            Observaciones técnicas
          </h3>
        </div>
        <div className="bg-slate-50 p-6 rounded-[2rem] text-sm text-slate-700 leading-relaxed font-medium italic border border-slate-200/80 shadow-2xs">
          {f.observations || 'Sin anotaciones registradas.'}
        </div>
      </div>

      {/* Recordatorios Vinculados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
            <Bell className="h-4 w-4 text-cyan-600" />
            Recordatorios Vinculados
          </h3>
          {isAuthorized && (
            <button
              onClick={() => {
                if (setEditingReminder && setIsReminderModalOpen) {
                  setEditingReminder({
                    id: '',
                    title: `Recordatorio: ${f.name}`,
                    date: new Date().toISOString().split('T')[0],
                    festivalId: f.id,
                    createdAt: new Date().toISOString(),
                    createdBy: '',
                  });
                  setIsReminderModalOpen(true);
                }
              }}
              className="text-[10px] font-black uppercase tracking-wider bg-cyan-50 hover:bg-cyan-100 text-cyan-700 px-3 py-1.5 rounded-full border border-cyan-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
            >
              <Plus className="h-3.5 w-3.5" /> Crear Recordatorio
            </button>
          )}
        </div>

        {linkedReminders.length === 0 ? (
          <div className="bg-slate-50 p-6 rounded-[2rem] text-xs text-slate-400 italic text-center border border-slate-100">
            No hay recordatorios vinculados a este festival. Puedes agendar alertas de correos, seguimiento con comités o avisos clave.
          </div>
        ) : (
          <div className="space-y-2">
            {linkedReminders.map((rem) => (
              <div
                key={rem.id}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 hover:bg-white transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-cyan-100/70 text-cyan-700 rounded-xl shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-800 truncate">{rem.title}</h4>
                    <p className="text-[10px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3 text-slate-400" />
                        {formatDisplayDate(rem.date)}
                      </span>
                      {rem.time && (
                        <span>• {rem.time} hs</span>
                      )}
                    </p>
                  </div>
                </div>

                {isAuthorized && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        if (setEditingReminder && setIsReminderModalOpen) {
                          setEditingReminder(rem);
                          setIsReminderModalOpen(true);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                      title="Editar recordatorio"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("¿Estás seguro de eliminar este recordatorio?")) {
                          deleteReminder?.(rem.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar recordatorio"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de Estados (Trazabilidad) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
            <History className="h-4 w-4 text-slate-900" />
            Historial de estados (trazabilidad)
          </h3>
          <div className="flex items-center gap-2">
            {isAuthorized && handleUpdateStatus && (
              <button
                onClick={() => setIsStatusModalOpen(true)}
                className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Cambiar Estado con Nota
              </button>
            )}
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              {f.statusHistory?.length || 0} registros
            </span>
          </div>
        </div>

        {(!f.statusHistory || f.statusHistory.length === 0) ? (
          <div className="bg-slate-50 p-6 rounded-[2rem] text-xs text-slate-400 italic text-center border border-slate-100">
            Sin historial previo de cambio de estados. Cada vez que se modifique el estado de este festival se registrará la fecha, estado anterior y usuario.
          </div>
        ) : (
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {f.statusHistory.slice().reverse().map((item: StatusHistoryEntry, idx: number) => {
                const styles = getStatusColorStyles(item.status);
                const formattedDate = item.timestamp
                  ? new Date(item.timestamp).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Fecha desconocida';

                return (
                  <div key={`fest-hist-${f.id}-${item.id || 'h'}-${idx}`} className="relative group">
                    <div className="absolute -left-[1.375rem] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-slate-400 group-first:border-[#e91e63] group-first:bg-[#e91e63]" />
                    
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider", styles)}>
                          {item.status}
                        </span>
                        {item.previousStatus && (
                          <span className="text-[10px] font-medium text-slate-400">
                            (Antes: {item.previousStatus})
                          </span>
                        )}
                        {item.note && (
                          <span className="text-[10px] text-slate-500 italic">
                            • {item.note}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold shrink-0">
                        {item.updatedBy && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <User className="h-3 w-3" /> {item.updatedBy}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sección de Ediciones Vinculadas del Festival (Línea de Tiempo / Timeline) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
            <Layers className="h-4 w-4 text-slate-900" />
            Ediciones vinculadas del festival (Línea de tiempo)
          </h3>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {linkedEditions.length} {linkedEditions.length === 1 ? 'edición vinculada' : 'ediciones vinculadas'}
          </span>
        </div>

        {linkedEditions.length === 0 ? (
          <div className="bg-slate-50 p-6 rounded-[2rem] text-xs text-slate-400 italic text-center border border-slate-100">
            No hay otras ediciones registradas para este festival. Cuando crees una nueva edición desde el botón "Nueva edición", aparecerá vinculada en la línea de tiempo automáticamente.
          </div>
        ) : (
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {linkedEditions.map((item) => {
                const isDirectPrevious = f.previousEditionId === item.id;
                const isDirectNext = item.previousEditionId === f.id;

                return (
                  <div key={`linked-fest-tl-${item.id}`} className="relative group">
                    <div className="absolute -left-[1.375rem] top-3.5 w-3 h-3 rounded-full bg-white border-2 border-indigo-500 group-hover:scale-125 group-hover:bg-indigo-600 transition-all" />
                    
                    <div 
                      onClick={() => {
                        if (setSelectedFestival) {
                          setSelectedFestival(item);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isDirectPrevious && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                              Edición Anterior Directa
                            </span>
                          )}
                          {isDirectNext && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md border border-sky-200">
                              Nueva Edición Siguiente
                            </span>
                          )}
                          {!isDirectPrevious && !isDirectNext && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                              Edición Histórica
                            </span>
                          )}
                          {(item.editionYear || (item as any).year) && (
                            <span className="text-[9px] font-black bg-slate-800 text-white px-2 py-0.5 rounded-md">
                              {item.editionYear || (item as any).year}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                          {item.name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest border px-2.5 py-0.5 rounded-full flex items-center gap-1",
                          getStatusColorStyles(item.status)
                        )}>
                          {getStatusIcon(item.status, 'h-3 w-3')}
                          {item.status}
                        </span>

                        <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          Ver Ficha <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {handleUpdateStatus && (
        <ChangeStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          festival={f}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Modal de Confirmación Previa para Nueva Edición */}
      <AnimatePresence>
        {isNewEditionConfirmOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewEditionConfirmOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center gap-3 text-emerald-600">
                <RefreshCw className="h-7 w-7 animate-spin-slow" />
                <h3 className="text-xl font-black tracking-tight text-slate-800">
                  Nueva Edición de Festival
                </h3>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-2xl text-emerald-900 text-sm leading-relaxed font-medium">
                Vas a abrir una nueva edición de <strong>"{f.name}"</strong>. Podrás actualizar las fechas de convocatoria, categorías, requerimientos y plataforma manteniendo intacto el registro histórico de esta edición previa.
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 cursor-pointer hover:bg-slate-100/60 transition-colors" onClick={() => setNewEditionConfirmChecked(!newEditionConfirmChecked)}>
                <input
                  type="checkbox"
                  id="chk-confirm-new-edition"
                  checked={newEditionConfirmChecked}
                  onChange={(e) => setNewEditionConfirmChecked(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-[#e91e63] focus:ring-[#e91e63] cursor-pointer"
                />
                <label htmlFor="chk-confirm-new-edition" className="text-xs font-bold text-slate-700 cursor-pointer select-none leading-snug">
                  Entiendo y deseo continuar a la apertura de la nueva edición.
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewEditionConfirmOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-confirm-start-new-edition"
                  disabled={!newEditionConfirmChecked}
                  onClick={() => {
                    setIsNewEditionConfirmOpen(false);
                    setModalType('new_edition');
                    setIsModalOpen(true);
                  }}
                  className={cn(
                    "flex-1 py-3.5 rounded-2xl font-black text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2",
                    newEditionConfirmChecked
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                      : "bg-slate-300 cursor-not-allowed shadow-none"
                  )}
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
