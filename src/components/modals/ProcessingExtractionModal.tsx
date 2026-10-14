import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Sparkles, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ProcessingExtractionModalProps {
  isOpen: boolean;
  currentStep?: number; // 1 a 5
  statusMessage?: string;
}

const STEPS = [
  { step: 1, title: 'Lectura y Normalización', desc: 'Saneamiento de texto y extracción de URLs' },
  { step: 2, title: 'Análisis Heurístico & NLP', desc: 'Detección de fechas, plataformas y tasas' },
  { step: 3, title: 'Cotejo Canónico', desc: 'Validación cruzada contra catálogo de festivales' },
  { step: 4, title: 'Deduplicación de 5 Capas', desc: 'Identificación de duplicados y postulaciones activas' },
  { step: 5, title: 'Estructuración de Lote', desc: 'Generación de entidades para revisión' },
];

export const ProcessingExtractionModal: React.FC<ProcessingExtractionModalProps> = ({
  isOpen,
  currentStep = 1,
  statusMessage = 'Analizando contenido del portapapeles...',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop difuminado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Tarjeta con escala y opacidad elástica */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 z-10 flex flex-col items-center text-center space-y-6"
          >
            {/* Indicador superior animado */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-pink-50 text-[#e91e63] flex items-center justify-center border border-pink-100 shadow-sm">
                <Sparkles className="w-8 h-8 animate-pulse text-[#e91e63]" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-xs border border-slate-100">
                <Loader2 className="w-4 h-4 text-slate-700 animate-spin" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Extracción de Portapapeles
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {statusMessage}
              </p>
            </div>

            {/* Pasos secuenciales del pipeline */}
            <div className="w-full space-y-2.5 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {STEPS.map((s) => {
                const isCompleted = currentStep > s.step;
                const isCurrent = currentStep === s.step;

                return (
                  <div
                    key={s.step}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                      isCurrent
                        ? 'bg-white shadow-xs border border-pink-100'
                        : isCompleted
                        ? 'opacity-75'
                        : 'opacity-40'
                    }`}
                  >
                    <div className="shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-[#e91e63] animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-400">
                          {s.step}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-slate-900' : 'text-slate-600'}`}>
                        {s.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Barra de progreso interactiva */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="bg-[#e91e63] h-full"
                initial={{ width: '10%' }}
                animate={{ width: `${Math.min(100, Math.max(15, (currentStep / 5) * 100))}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
