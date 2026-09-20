import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, User } from 'lucide-react';
import { AppNote } from '../types';
import { cn } from '../utils/helpers';

// Definir el tipo para Notification, según cómo se usa.
// Asumo que el type es algo como 'info' | 'warning' | 'success' | 'error'
type NotificationType = 'info' | 'warning' | 'success' | 'error';

interface ProductionNotesProps {
  notes: AppNote[];
  setNotes: React.Dispatch<React.SetStateAction<AppNote[]>>;
  userName: string;
  addNotification: (type: NotificationType | string, title: string, message: string) => void;
  showAlert: (msg: string) => void;
  addAuditLog?: (collection: string, details: string) => void;
}

export const ProductionNotes: React.FC<ProductionNotesProps> = ({ notes, setNotes, userName, addNotification, showAlert, addAuditLog }) => {
  const [newNote, setNewNote] = useState({ title: '', content: '', color: '#e91e63' });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const NOTE_COLORS = ['#e91e63', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

  return (
    <div className="space-y-8 pb-32">
      <header className="flex justify-between items-center bg-gradient-to-r from-pink-100 to-transparent p-6 rounded-[2.5rem] border border-white">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-800">NOTAS</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] mt-1 font-bold italic">Ideas, contactos y recordatorios</p>
        </div>
        <button id="btn-auto-24" 
          onClick={() => {
             if (showForm) {
               setShowForm(false);
               setEditingId(null);
               setNewNote({ title: '', content: '', color: '#e91e63' });
             } else {
               setShowForm(true);
             }
          }}
          className={cn(
            "h-16 w-16 rounded-3xl flex items-center justify-center text-white shadow-xl transition-all flex-shrink-0",
            showForm ? "bg-slate-800 rotate-45" : "bg-gradient-to-tr from-[#f48fb1] to-[#e91e63] shadow-[#e91e63]/20"
          )}
        >
          <Plus className="h-8 w-8" />
        </button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            key="production-note-form"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 space-y-4 border-l-4"
            style={{ borderLeftColor: newNote.color }}
          >
            <div className="flex gap-2">
               {NOTE_COLORS.map((c, idx) => (
                  <button id="btn-auto-25"
                     key={`${c}-${idx}`}
                     onClick={() => setNewNote({...newNote, color: c})}
                     className={cn("h-6 w-6 rounded-full border-2 transition-transform", newNote.color === c ? "scale-125 border-slate-800" : "border-transparent")}
                     style={{ backgroundColor: c }}
                  />
               ))}
            </div>
            <input 
              type="text" 
              placeholder="Título de la nota..."
              className="w-full bg-slate-50 p-3 rounded-xl focus:outline-none font-black uppercase text-xs"
              value={newNote.title}
              onChange={e => setNewNote({...newNote, title: e.target.value})}
            />
            <textarea 
              placeholder="Escribe lo que se te cante..."
              className="w-full bg-slate-50 p-3 rounded-xl focus:outline-none text-sm min-h-[100px]"
              value={newNote.content}
              onChange={e => setNewNote({...newNote, content: e.target.value})}
            />
            <button id="btn-auto-26" 
              onClick={() => {
                if (newNote.title.trim() || newNote.content.trim()) {
                  if (editingId) {
                     setNotes(notes.map(n => n.id === editingId ? { ...n, title: newNote.title.trim(), content: newNote.content.trim(), color: newNote.color } : n));
                     addAuditLog && addAuditLog('bitacora', `${userName} ha editado una nota en la bitácora: "${newNote.title.trim()}".`);
                     setEditingId(null);
                  } else {
                     setNotes(prev => [{ id: Date.now().toString(), title: newNote.title.trim(), content: newNote.content.trim(), date: new Date().toISOString(), author: userName, color: newNote.color }, ...prev]);
                     addAuditLog && addAuditLog('bitacora', `${userName} ha credo una nota en la bitácora: "${newNote.title.trim()}".`);
                  }
                  setNewNote({ title: '', content: '', color: '#e91e63' });
                  setShowForm(false);
                } else {
                  showAlert("Debes escribir al menos un título o contenido para la nota.");
                }
              }}
              className="w-full text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs shadow-lg"
              style={{ backgroundColor: newNote.color }}
            >
              {editingId ? 'Actualizar Nota 💾' : 'Guardar Nota 💾'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="columns-1 md:columns-2 gap-4 space-y-4">
        {notes.map((note, idx) => (
          <div key={`note-${note.id || 'n'}-${idx}`} className="glass-card break-inside-avoid group border-l-4" style={{ borderLeftColor: note.color || '#e91e63' }}>
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <h3 className="font-black text-slate-700 uppercase tracking-tight text-sm">{note.title}</h3>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1">
                  <User className="h-3 w-3" /> {note.author || 'Anon'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  setNewNote({ title: note.title, content: note.content, color: note.color || '#e91e63' });
                  setEditingId(note.id);
                  setShowForm(true);
                }} className="text-slate-400 hover:text-blue-500 transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button id="btn-auto-27" onClick={() => {
                  setNotes((prev) => prev.filter(n => n.id !== note.id));
                  addAuditLog && addAuditLog('bitacora', `${userName} ha borrado la nota de bitácora: "${note.title}".`);
                }} className="text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{note.content}</div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-4 text-right">
              {new Date(note.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
