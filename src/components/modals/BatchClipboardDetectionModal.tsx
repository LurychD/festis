import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  AlertTriangle,
  Film,
  Calendar,
  DollarSign,
  Globe,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Sparkles,
  Layers,
  Sparkle
} from 'lucide-react';
import { Festival, FestivalStatus } from '../../types';
import { useProjectRole, useProject } from '../../context/ProjectContext';
import { DeduplicationResult } from '../../utils/clipboardDeduplicator';

export interface BatchItemCandidate extends Partial<Festival> {
  deduplication?: DeduplicationResult;
  isBatchDuplicate?: boolean;
  selectedForImport?: boolean;
}

interface BatchClipboardDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: BatchItemCandidate[];
  onConfirm: (approvedFestivals: Festival[]) => Promise<void>;
}

export const BatchClipboardDetectionModal: React.FC<BatchClipboardDetectionModalProps> = ({
  isOpen,
  onClose,
  candidates: initialCandidates,
  onConfirm,
}) => {
  const { isDistributor } = useProjectRole();
  const { currentProject } = useProject();

  const [items, setItems] = useState<BatchItemCandidate[]>(() =>
    initialCandidates.map((c) => ({
      ...c,
      // Se preseleccionan los únicos y las nuevas ediciones legítimas
      selectedForImport: !c.deduplication?.isDuplicate || c.deduplication?.classification === 'NUEVA_EDICION',
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizar candidatos cuando cambian desde props
  React.useEffect(() => {
    setItems(
      initialCandidates.map((c) => ({
        ...c,
        selectedForImport: !c.deduplication?.isDuplicate || c.deduplication?.classification === 'NUEVA_EDICION',
      }))
    );
  }, [initialCandidates]);

  const toggleSelect = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, selectedForImport: !item.selectedForImport } : item
      )
    );
  };

  const updateItemField = (index: number, field: keyof Festival, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const selectedCount = items.filter((i) => i.selectedForImport).length;

  const handleCommit = async () => {
    if (!isDistributor || isSubmitting) return;

    const approved: Festival[] = items
      .filter((i) => i.selectedForImport)
      .map((i, idx) => ({
        id: i.id || `fest_${Date.now()}_${idx}`,
        name: (i.name || 'Festival sin título').trim(),
        country: (i.country || 'A confirmar').trim(),
        type: i.type || 'Festival🎬',
        status: i.status || FestivalStatus.POR_ENVIAR,
        category: i.category || 'Cortometraje',
        deadline: i.deadline || undefined,
        newsDate: i.newsDate || undefined,
        link: i.link || undefined,
        platform: i.platform || 'Propia',
        price: i.price || 'Gratis',
        fee: i.fee || 0,
        observations: i.observations || undefined,
        projectionLocation: i.projectionLocation || undefined,
        tasks: i.tasks || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

    if (approved.length === 0) {
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(approved);
      onClose();
    } catch (err) {
      console.error('Error al persistir lote de festivales:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop sincronizado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Contenedor Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            className="relative bg-white rounded-3xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl border border-slate-100 z-10 flex flex-col max-h-[90vh]"
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pink-50 text-[#e91e63] rounded-2xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    Revisión de Convocatorias
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alerta de Modo Lectura si no es distribuidor */}
            {!isDistributor && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-semibold flex-shrink-0">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Modo lectura (Rol sin permisos de escritura en este proyecto).</span>
              </div>
            )}

            {/* Listado con scroll y despeje de controles flotantes */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 pb-16">
              {items.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm font-medium">
                  No se encontraron candidatos válidos para importar.
                </div>
              ) : (
                items.map((item, index) => {
                  const dedup = item.deduplication;
                  const isDup = dedup?.isDuplicate;
                  const isNewEdition = dedup?.classification === 'NUEVA_EDICION';
                  const isSelected = item.selectedForImport;

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl border transition-all ${
                        isNewEdition
                          ? 'bg-blue-50/40 border-blue-200 shadow-sm'
                          : isDup
                          ? 'bg-amber-50/40 border-amber-200/80'
                          : isSelected
                          ? 'bg-white border-slate-200 shadow-sm'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox de selección */}
                        <button
                          type="button"
                          onClick={() => toggleSelect(index)}
                          className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                            isSelected
                              ? isNewEdition
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#e91e63] text-white'
                              : 'border-2 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div className="flex-1 space-y-3 min-w-0">
                          {/* Banner de Clasificación de Deduplicación */}
                          {isNewEdition ? (
                            <div className="flex items-center gap-2 p-2 bg-blue-100/70 border border-blue-300/80 rounded-xl text-blue-900 text-[11px] font-bold">
                              <Layers className="w-4 h-4 text-blue-700 flex-shrink-0" />
                              <span className="truncate">
                                Nueva Edición Detectada (Capa {dedup?.layerMatched}):{' '}
                                {dedup?.reason}
                              </span>
                            </div>
                          ) : isDup ? (
                            <div className="flex items-center gap-2 p-2 bg-amber-100/70 border border-amber-300/80 rounded-xl text-amber-900 text-[11px] font-bold">
                              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                              <span className="truncate">
                                Duplicado Detectado (Capa {dedup?.layerMatched}):{' '}
                                {dedup?.reason}
                              </span>
                            </div>
                          ) : null}

                          {/* Campos editables principales */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <input
                                type="text"
                                value={item.name || ''}
                                onChange={(e) => updateItemField(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                                placeholder="Nombre del Festival"
                              />
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={item.country || ''}
                                onChange={(e) => updateItemField(index, 'country', e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                                placeholder="País"
                              />
                              <input
                                type="date"
                                value={item.deadline || ''}
                                onChange={(e) => updateItemField(index, 'deadline', e.target.value)}
                                className="w-36 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                              />
                            </div>
                          </div>

                          {/* Enlace, arancel y categoría */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            {item.link ? (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg max-w-[240px] truncate transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{item.link}</span>
                              </a>
                            ) : null}

                            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.price || 'Gratis'}</span>
                            </div>

                            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                              <Film className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.category || 'Cortometraje'}</span>
                            </div>

                            {item.platform && (
                              <span className="px-2 py-0.5 bg-pink-50 text-[#e91e63] font-bold text-[10px] rounded-md border border-pink-100">
                                {item.platform}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botón descartar */}
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-slate-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors flex-shrink-0"
                          title="Descartar este festival"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Barra de acción ergonómica inferior */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCommit}
                disabled={!isDistributor || selectedCount === 0 || isSubmitting}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black shadow-lg transition-all ${
                  isDistributor && selectedCount > 0 && !isSubmitting
                    ? 'bg-[#e91e63] text-white hover:bg-pink-600 shadow-pink-500/20 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando en Proyecto...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Importar {selectedCount} Festival(es)</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
