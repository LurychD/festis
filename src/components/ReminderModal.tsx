import React, { useState, useEffect } from 'react';
import { Reminder, Festival } from '../types';
import { X, Calendar as CalendarIcon, Clock, Link as LinkIcon, Type, Save } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'createdBy'>) => void;
  initialData?: Reminder | null;
  festivals: Festival[];
  defaultDate?: Date | null;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  festivals,
  defaultDate 
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [festivalId, setFestivalId] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDate(initialData.date);
      setTime(initialData.time || '');
      setFestivalId(initialData.festivalId || '');
    } else {
      setTitle('');
      setDate(defaultDate ? defaultDate.toISOString().split('T')[0] : '');
      setTime('');
      setFestivalId('');
    }
  }, [initialData, defaultDate, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-cyan-50">
          <h2 className="text-xl font-bold text-cyan-900 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {initialData ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 hover:bg-cyan-100 rounded-full transition-colors text-cyan-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSave({ title, date, time: time || undefined, festivalId: festivalId || undefined });
          onClose();
        }} className="p-6 space-y-5">
          <div className="space-y-1.5 p-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-1.5">
              <Type className="h-3 w-3" /> Título
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-cyan-500 font-medium outline-none transition-all"
              placeholder="Ej. Mandar correo a distribuidora"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 p-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-1.5">
                <CalendarIcon className="h-3 w-3" /> Fecha
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-cyan-500 font-medium outline-none transition-all text-slate-700"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Hora <span className="opacity-50 lowercase tracking-normal">(opcional)</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-cyan-500 font-medium outline-none transition-all text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1.5 p-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-1.5">
              <LinkIcon className="h-3 w-3" /> Vincular Festival <span className="opacity-50 lowercase tracking-normal">(opcional)</span>
            </label>
            <select
              value={festivalId}
              onChange={(e) => setFestivalId(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-cyan-500 font-medium outline-none transition-all cursor-pointer text-slate-700"
            >
              <option value="">-- Sin Vincular --</option>
              {festivals.map((f, idx) => (
                <option key={`${f.id}-${idx}`} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3.5 rounded-2xl font-bold text-white bg-cyan-600 hover:bg-cyan-700 active:scale-95 transition-all shadow-lg flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar Recordatorio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
