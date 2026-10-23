import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  AlertTriangle,
  Calendar,
  Globe,
  DollarSign,
  ExternalLink,
  Trash2,
  RefreshCw,
  CopyCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Festival } from '../../types';
import { BatchItemCandidate } from './BatchClipboardDetectionModal';
import { highlightMatchingTokens } from '../../utils/textHighlightUtils';

interface DuplicateComparisonViewProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: BatchItemCandidate;
  candidateIndex: number;
  onDiscardNew: (index: number) => void;
  onUpdateExisting: (index: number, existingFestivalId?: string) => void;
  onKeepBoth: (index: number) => void;
  canEdit?: boolean;
}

export const DuplicateComparisonView: React.FC<DuplicateComparisonViewProps> = ({
  isOpen,
  onClose,
  candidate,
  candidateIndex,
  onDiscardNew,
  onUpdateExisting,
  onKeepBoth,
  canEdit = true,
}) => {
  if (!isOpen) return null;

  const dedup = candidate.deduplication;
  const matched = dedup?.matchedFestival;
  const isDailyCache = dedup?.origin === 'DAILY_CACHE';

  // Resaltado de nombres
  const nameHighlight = highlightMatchingTokens(
    candidate.name || 'Sin título',
    matched?.name || 'Registro existente'
  );

  // Resaltado de enlaces
  const linkHighlight = highlightMatchingTokens(
    candidate.link || '',
    matched?.link || ''
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative bg-white rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] my-auto"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`p-2.5 rounded-2xl flex-shrink-0 ${
                  isDailyCache ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-800 truncate">
                  Comparativa de Convocatoria
                </h3>
                <p className="text-xs font-semibold text-slate-500 whitespace-normal break-words">
                  {dedup?.reason || 'Similitud detectada por el motor de 5 capas de Cardigan'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Cerrar comparativa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grilla Side-by-Side: Apilado A sobre B en mobile, dos columnas en desktop */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Columna A: Nuevo Copy Detectado */}
              <div className="p-4 bg-pink-50/40 border-2 border-pink-200/80 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-pink-100">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#e91e63] bg-white px-2 py-0.5 rounded-md border border-pink-200">
                      Candidato Nuevo (Portapapeles)
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Capa {dedup?.layerMatched || 'Lote'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Nombre
                    </span>
                    <div className="text-sm font-bold text-slate-900 whitespace-normal break-words">
                      {nameHighlight.highlightedA}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white rounded-xl border border-pink-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">País</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        {candidate.country || 'A confirmar'}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-pink-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Cierre</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {candidate.deadline || 'Sin fecha'}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-pink-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Fee</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        {candidate.price || 'Gratis'}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-pink-100">
                      <span className="text-[10px] text-slate-400 block font-semibold">Categoría</span>
                      <span className="font-bold text-slate-700 block truncate mt-0.5">
                        {candidate.category || 'General'}
                      </span>
                    </div>
                  </div>

                  {candidate.link && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Enlace
                      </span>
                      <div className="p-2 bg-white rounded-xl border border-pink-100 text-xs font-mono text-slate-600 break-all">
                        {linkHighlight.highlightedA}
                      </div>
                    </div>
                  )}

                  {candidate.rawSnippet && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Fragmento Original
                      </span>
                      <div className="p-2.5 bg-white/80 rounded-xl border border-pink-100 text-[11px] font-mono text-slate-600 max-h-28 overflow-y-auto whitespace-pre-wrap break-words">
                        {candidate.rawSnippet}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna B: Registro Existente o Copy Previo */}
              <div
                className={`p-4 rounded-2xl flex flex-col justify-between space-y-3 border-2 ${
                  isDailyCache
                    ? 'bg-purple-50/40 border-purple-200/80'
                    : 'bg-amber-50/40 border-amber-200/80'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border bg-white ${
                        isDailyCache
                          ? 'text-purple-700 border-purple-200'
                          : 'text-amber-700 border-amber-200'
                      }`}
                    >
                      {isDailyCache ? 'Copy Previo de Hoy' : 'Registro en Obra'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {matched?.id || 'Cache 24h'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Nombre
                    </span>
                    <div className="text-sm font-bold text-slate-900 whitespace-normal break-words">
                      {nameHighlight.highlightedB}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block font-semibold">País</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        {matched?.country || 'A confirmar'}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block font-semibold">Cierre</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {matched?.deadline || 'Sin fecha'}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block font-semibold">Fee</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        {matched?.price || 'Gratis'}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block font-semibold">Estado</span>
                      <span className="font-bold text-slate-700 block truncate mt-0.5">
                        {matched?.status || 'Por enviar'}
                      </span>
                    </div>
                  </div>

                  {matched?.link && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Enlace
                      </span>
                      <div className="p-2 bg-white rounded-xl border border-slate-200/60 text-xs font-mono text-slate-600 break-all">
                        {linkHighlight.highlightedB}
                      </div>
                    </div>
                  )}

                  {matched?.observations && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Observaciones Previas
                      </span>
                      <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200/60 text-[11px] text-slate-600 max-h-28 overflow-y-auto whitespace-pre-wrap break-words">
                        {matched.observations}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Acciones Resolutivas (Ergonomía táctil con touch targets >= 44px) */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-shrink-0">
            {/* Acción Destructiva aislada */}
            <button
              type="button"
              onClick={() => {
                onDiscardNew(candidateIndex);
                onClose();
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 active:scale-95 transition-all font-bold text-xs min-h-[44px] cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Descartar nuevo</span>
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Conservar ambos registros */}
              <button
                type="button"
                onClick={() => {
                  onKeepBoth(candidateIndex);
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all font-bold text-xs min-h-[44px] cursor-pointer"
              >
                <CopyCheck className="w-4 h-4 text-slate-600" />
                <span>Conservar ambos</span>
              </button>

              {/* Actualizar existente si corresponde */}
              {!isDailyCache && matched?.id && canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateExisting(candidateIndex, matched.id);
                    onClose();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white active:scale-95 transition-all font-bold text-xs min-h-[44px] shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Actualizar existente</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
