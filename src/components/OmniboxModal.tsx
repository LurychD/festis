import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Film,
  Calendar,
  Layers,
  FileText,
  BarChart2,
  CheckSquare,
  Settings,
  HelpCircle,
  Bell,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react';
import { Festival, Reminder } from '../types';

interface OmniboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  festivals: Festival[];
  reminders: Reminder[];
  setView: (view: string) => void;
  setSelectedFestival: (festival: Festival | null) => void;
}

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Vista' | 'Festival' | 'Recordatorio';
  icon: React.ReactNode;
  action: () => void;
}

export const OmniboxModal: React.FC<OmniboxModalProps> = ({
  isOpen,
  onClose,
  festivals,
  reminders,
  setView,
  setSelectedFestival,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Vistas rápidas de navegación
  const navViews: { id: string; title: string; view: string; icon: React.ReactNode }[] = [
    { id: 'view-festivals', title: 'Ver Festivales', view: 'festivals', icon: <Film className="w-4 h-4 text-[#e91e63]" /> },
    { id: 'view-calendar', title: 'Calendario de Convocatorias', view: 'calendar', icon: <Calendar className="w-4 h-4 text-purple-400" /> },
    { id: 'view-planning', title: 'Planificación Estratégica', view: 'planning', icon: <Layers className="w-4 h-4 text-emerald-400" /> },
    { id: 'view-tasks', title: 'Gestor de Tareas', view: 'tasks', icon: <CheckSquare className="w-4 h-4 text-amber-400" /> },
    { id: 'view-stats', title: 'Estadísticas y Análisis', view: 'stats', icon: <BarChart2 className="w-4 h-4 text-cyan-400" /> },
    { id: 'view-film-data', title: 'Ficha Técnica de la Película', view: 'film_data', icon: <FileText className="w-4 h-4 text-rose-400" /> },
    { id: 'view-config', title: 'Configuración y Base de Datos', view: 'config', icon: <Settings className="w-4 h-4 text-slate-600" /> },
    { id: 'view-help', title: 'Centro de Ayuda', view: 'help', icon: <HelpCircle className="w-4 h-4 text-indigo-400" /> },
  ];

  // Calcular resultados filtrados
  const results: SearchResultItem[] = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: SearchResultItem[] = [];

    // 1. Coincidencias de navegación
    navViews.forEach((nv) => {
      if (!q || nv.title.toLowerCase().includes(q)) {
        items.push({
          id: nv.id,
          title: nv.title,
          category: 'Vista',
          icon: nv.icon,
          action: () => {
            setView(nv.view);
            onClose();
          },
        });
      }
    });

    // 2. Coincidencias de Festivales
    if (q) {
      festivals.forEach((f) => {
        if (
          f.name.toLowerCase().includes(q) ||
          f.country?.toLowerCase().includes(q) ||
          f.projectionLocation?.toLowerCase().includes(q) ||
          f.status?.toLowerCase().includes(q)
        ) {
          items.push({
            id: `fest-${f.id}`,
            title: f.name,
            subtitle: `${f.country || 'Sin país'} • Status: ${f.status}`,
            category: 'Festival',
            icon: <Film className="w-4 h-4 text-[#e91e63]" />,
            action: () => {
              setSelectedFestival(f);
              setView('details');
              onClose();
            },
          });
        }
      });

      // 3. Coincidencias de Recordatorios
      reminders.forEach((r) => {
        if (r.title.toLowerCase().includes(q)) {
          items.push({
            id: `rem-${r.id}`,
            title: r.title,
            subtitle: r.date ? `Fecha: ${r.date}` : 'Recordatorio programado',
            category: 'Recordatorio',
            icon: <Bell className="w-4 h-4 text-amber-400" />,
            action: () => {
              setView('calendar');
              onClose();
            },
          });
        }
      });
    }

    return items.slice(0, 10);
  }, [query, festivals, reminders, setView, setSelectedFestival, onClose]);

  // Manejo de foco automático
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Teclas de navegación en menú
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          className="w-full max-w-2xl bg-white/95 border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-slate-900/5"
        >
          {/* Header con Input */}
          <div className="relative flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/70">
            <Search className="w-5 h-5 text-[#e91e63] mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar festivales, secciones, tareas o presiona Esc..."
              className="w-full bg-transparent text-slate-800 placeholder:text-slate-500 text-sm font-semibold focus:outline-none"
            />
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-slate-500 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-slate-200/60 rounded border border-slate-300">
                ESC
              </span>
            )}
          </div>

          {/* Resultados */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-1 scrollbar-thin">
            {results.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#e91e63] animate-pulse" />
                <p className="font-medium">No se encontraron resultados para &quot;{query}&quot;.</p>
              </div>
            ) : (
              results.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all text-sm ${
                      isSelected
                        ? 'bg-pink-50 text-[#e91e63] border border-pink-200/80 shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl flex-shrink-0 ${isSelected ? 'bg-pink-100 text-[#e91e63]' : 'bg-slate-100 text-slate-600'}`}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold truncate ${isSelected ? 'text-[#e91e63]' : 'text-slate-800'}`}>{item.title}</div>
                        {item.subtitle && (
                          <div className="text-xs text-slate-500 font-medium truncate">{item.subtitle}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${isSelected ? 'bg-pink-100/80 text-[#e91e63] border-pink-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {item.category}
                      </span>
                      {isSelected && <ArrowRight className="w-4 h-4 text-[#e91e63]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Informativo */}
          <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="px-1.5 py-0.5 bg-white text-slate-700 rounded border border-slate-200 shadow-xs font-mono font-bold">↑↓</kbd> Navegar
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white text-slate-700 rounded border border-slate-200 shadow-xs font-mono font-bold">↵</kbd> Seleccionar
              </span>
            </div>
            <span className="font-semibold text-slate-500">Festis Búsqueda Rápida</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
