import React, { useState, useEffect } from "react";
import { Festival, FestivalStatus } from "../types";
import { RefreshCw, MessageSquare, Check, X, Calendar } from "lucide-react";
import { getStatusColorStyles, formatDateTimeForInput, cn } from "../utils/helpers";

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  festival: Festival | null;
  onUpdateStatus: (id: string, newStatus: FestivalStatus, note?: string, customDate?: string) => void;
}

export const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  isOpen,
  onClose,
  festival,
  onUpdateStatus,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<FestivalStatus>(
    festival?.status || FestivalStatus.POR_ENVIAR
  );
  const [note, setNote] = useState<string>("");
  const [customDate, setCustomDate] = useState<string>(() => formatDateTimeForInput(new Date().toISOString()));

  useEffect(() => {
    if (festival) {
      setSelectedStatus(festival.status);
      setNote("");
      setCustomDate(formatDateTimeForInput(new Date().toISOString()));
    }
  }, [festival]);

  if (!isOpen || !festival) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(festival.id, selectedStatus, note.trim() || undefined, customDate || undefined);
    onClose();
  };

  const currentStyles = getStatusColorStyles(festival.status);
  const newStyles = getStatusColorStyles(selectedStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="glass-card bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 space-y-5 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">
                Cambiar Estado
              </h3>
              <p className="text-[11px] font-bold text-slate-400 line-clamp-1">
                {festival.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transition Visualizer */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between gap-2">
            <div className="text-center flex-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Estado Actual
              </span>
              <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block", currentStyles)}>
                {festival.status}
              </span>
            </div>

            <span className="text-slate-300 font-bold text-lg">➔</span>

            <div className="text-center flex-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Nuevo Estado
              </span>
              <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block", newStyles)}>
                {selectedStatus}
              </span>
            </div>
          </div>

          {/* Selector de Nuevo Estado */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1">
              Seleccionar Nuevo Estado
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as FestivalStatus)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-xs font-bold text-slate-800 transition-all"
            >
              {Object.values(FestivalStatus).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha de Cambio de Estado */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              Fecha del Cambio de Estado
            </label>
            <input
              type="datetime-local"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-xs font-bold text-slate-800 transition-all"
            />
            <span className="text-[9px] font-medium text-slate-400 block ml-1">
              Por defecto es hoy. Puedes ajustarla si registras un cambio ocurrido anteriormente.
            </span>
          </div>

          {/* Nota Personalizada */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
              Nota Personalizada / Observación (Opcional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Recibimos email de confirmación, fee pagado de $15, etc."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400 resize-none transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              Guardar Estado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
