import React, { useState, useRef, useEffect } from 'react';
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
  Edit2,
  Clock
} from 'lucide-react';
import { Festival, FestivalStatus } from '../../types';
import { useProjectRole, useProject } from '../../context/ProjectContext';
import { DeduplicationResult } from '../../utils/clipboardDeduplicator';
import { isDiscardedOrClosed } from '../../data/seed';
import { DuplicateComparisonView } from './DuplicateComparisonView';

export interface BatchItemCandidate extends Partial<Festival> {
  deduplication?: DeduplicationResult;
  isBatchDuplicate?: boolean;
  selectedForImport?: boolean;
  rawSnippet?: string;
}

export function isCandidateExpiredOrClosed(item: {
  deadline?: string;
  isClosedOrDiscarded?: boolean;
  observations?: string;
  name?: string;
}): boolean {
  const today = new Date().toISOString().split('T')[0];
  if (item.deadline && item.deadline < today) return true;
  if (item.isClosedOrDiscarded) return true;
  if (item.observations && isDiscardedOrClosed(item.observations)) return true;
  if (item.name && isDiscardedOrClosed(item.name)) return true;
  return false;
}

export function isCandidateSelectedByDefault(c: BatchItemCandidate): boolean {
  if (isCandidateExpiredOrClosed(c)) return false;
  if (c.deduplication?.isDuplicate && c.deduplication?.classification !== 'NUEVA_EDICION') return false;
  return true;
}

interface BatchClipboardDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: BatchItemCandidate[];
  onConfirm: (approvedFestivals: Festival[]) => Promise<void>;
  onUpdateExistingFestival?: (updatedFestival: Festival) => Promise<void>;
}

export const BatchClipboardDetectionModal: React.FC<BatchClipboardDetectionModalProps> = ({
  isOpen,
  onClose,
  candidates: initialCandidates,
  onConfirm,
  onUpdateExistingFestival,
}) => {
  const { isDistributor } = useProjectRole();
  const { currentProject } = useProject();

  const [items, setItems] = useState<BatchItemCandidate[]>(() =>
    initialCandidates.map((c) => ({
      ...c,
      selectedForImport: isCandidateSelectedByDefault(c),
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [comparisonIndex, setComparisonIndex] = useState<number | null>(null);

  // Referencia para detección de doble tap (< 320ms)
  const lastTapRef = useRef<Record<number, number>>({});

  // Referencias y estado para Hold-to-Confirm de 3 segundos
  const [holdProgress, setHoldProgress] = useState(0); // 0 a 100
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<any>(null);
  const holdStartRef = useRef<number>(0);
  const isCompletedRef = useRef<boolean>(false);

  // Sincronizar candidatos cuando cambian desde props
  useEffect(() => {
    setItems(
      initialCandidates.map((c) => ({
        ...c,
        selectedForImport: isCandidateSelectedByDefault(c),
      }))
    );
    setEditingIndex(null);
  }, [initialCandidates]);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

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
    if (editingIndex === index) setEditingIndex(null);
    if (comparisonIndex === index) setComparisonIndex(null);
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleKeepBoth = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              selectedForImport: true,
              deduplication: item.deduplication
                ? {
                    ...item.deduplication,
                    isDuplicate: false,
                    classification: 'UNICO',
                  }
                : undefined,
            }
          : item
      )
    );
  };

  const handleUpdateExisting = async (index: number, existingFestivalId?: string) => {
    const item = items[index];
    if (existingFestivalId && item) {
      if (onUpdateExistingFestival) {
        await onUpdateExistingFestival({
          ...item.deduplication?.matchedFestival,
          ...item,
          id: existingFestivalId,
        } as Festival);
      }
      removeItem(index);
    }
  };

  // Manejo de Tap / Doble Tap en la tarjeta de festival
  const handleCardInteraction = (index: number, e: React.MouseEvent | React.TouchEvent) => {
    // Si se interactúa con un botón, input o enlace interactivo, no alternar
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a') ||
      target.closest('select')
    ) {
      return;
    }

    const now = Date.now();
    const lastTap = lastTapRef.current[index] || 0;
    const delta = now - lastTap;
    lastTapRef.current[index] = now;

    if (delta > 0 && delta < 320) {
      // Doble tap: activar edición inline
      setEditingIndex(index);
    } else {
      // Tap simple: alternar selección para importación
      toggleSelect(index);
    }
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
        type: i.type || 'Festival',
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
        createdAt: i.createdAt || new Date().toISOString(),
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
      setIsHolding(false);
      setHoldProgress(0);
      isCompletedRef.current = false;
    }
  };

  // Inicio de hold de 3 segundos
  const startHold = () => {
    if (!isDistributor || selectedCount === 0 || isSubmitting) return;
    setIsHolding(true);
    setHoldProgress(0);
    holdStartRef.current = Date.now();
    isCompletedRef.current = false;

    if (holdTimerRef.current) clearInterval(holdTimerRef.current);

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(100, (elapsed / 3000) * 100);
      setHoldProgress(progress);

      if (elapsed >= 3000) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
        setIsHolding(false);
        setHoldProgress(100);
        isCompletedRef.current = true;
        handleCommit();
      }
    }, 30);
  };

  // Cancelación preventiva de hold al soltar o salir antes de los 3s
  const cancelHold = () => {
    if (isCompletedRef.current) return;
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
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
                title="Cerrar modal"
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

            {/* Listado con scroll y despeje de controles inferiores */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1 pb-16">
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
                  const isEditing = editingIndex === index;

                  return (
                    <div
                      key={index}
                      onClick={(e) => handleCardInteraction(index, e)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                        isNewEdition
                          ? 'bg-blue-50/40 border-blue-200 shadow-sm'
                          : isDup
                          ? 'bg-amber-50/40 border-amber-200/80'
                          : isSelected
                          ? 'bg-white border-slate-200 shadow-sm ring-1 ring-[#e91e63]/20'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox de selección */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(index);
                          }}
                          className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                            isSelected
                              ? isNewEdition
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#e91e63] text-white'
                              : 'border-2 border-slate-300 hover:border-slate-400'
                          }`}
                          title={isSelected ? "Deseleccionar festival" : "Seleccionar para importar"}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div className="flex-1 space-y-2.5 min-w-0">
                          {/* Banner de Clasificación de Deduplicación */}
                          {isNewEdition ? (
                            <div className="flex items-center gap-2 p-2.5 bg-blue-100/70 border border-blue-300/80 rounded-xl text-blue-900 text-[11px] font-bold">
                              <Layers className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                              <span className="whitespace-normal break-words leading-relaxed">
                                Nueva Edición Detectada (Capa {dedup?.layerMatched}):{' '}
                                {dedup?.reason}
                              </span>
                            </div>
                          ) : isDup ? (
                            dedup?.origin === 'DAILY_CACHE' ? (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setComparisonIndex(index);
                                }}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 bg-purple-100/80 hover:bg-purple-100 border border-purple-300 rounded-xl text-purple-900 text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                <div className="flex items-start gap-2 min-w-0">
                                  <AlertTriangle className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />
                                  <span className="whitespace-normal break-words leading-relaxed">
                                    ¿Es la misma convocatoria? Coincide con un texto analizado anteriormente hoy ({dedup.matchedFestival?.name || 'copy previo'})
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setComparisonIndex(index);
                                  }}
                                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-[10px] font-bold hover:bg-purple-700 active:scale-95 transition-all flex-shrink-0 min-h-[44px] min-w-[44px] self-end sm:self-center cursor-pointer shadow-xs"
                                >
                                  <span>Ver Comparativa</span>
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setComparisonIndex(index);
                                }}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 bg-amber-100/70 hover:bg-amber-100/90 border border-amber-300/80 rounded-xl text-amber-900 text-[11px] font-bold cursor-pointer transition-colors"
                              >
                                <div className="flex items-start gap-2 min-w-0">
                                  <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                                  <span className="whitespace-normal break-words leading-relaxed">
                                    Ya en seguimiento: Coincide con festival existente ({dedup?.matchedFestival?.name || dedup?.reason})
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setComparisonIndex(index);
                                  }}
                                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-bold hover:bg-amber-700 active:scale-95 transition-all flex-shrink-0 min-h-[44px] min-w-[44px] self-end sm:self-center cursor-pointer shadow-xs"
                                >
                                  <span>Ver Comparativa</span>
                                </button>
                              </div>
                            )
                          ) : null}

                          {/* Banner de Convocatoria Vencida */}
                          {isCandidateExpiredOrClosed(item) && (
                            <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-bold">
                              <Clock className="w-4 h-4 text-rose-600 flex-shrink-0" />
                              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
                                Convocatoria Vencida
                              </span>
                              <span className="whitespace-normal break-words leading-relaxed">Plazo de postulación finalizado o convocatoria descartada</span>
                            </div>
                          )}

                          {/* Contenido: Modo Edición Inline vs Modo Lectura con Doble-Tap */}
                          {isEditing ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="p-3 bg-slate-50 border border-pink-200 rounded-xl space-y-3 cursor-default"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#e91e63]">
                                  Edición rápida inline
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingIndex(null);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#e91e63] text-white rounded-lg text-xs font-bold hover:bg-pink-600 transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Listo</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                  <input
                                    type="text"
                                    value={item.name || ''}
                                    onChange={(e) => updateItemField(index, 'name', e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                                    placeholder="Nombre del Festival"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    value={item.country || ''}
                                    onChange={(e) => updateItemField(index, 'country', e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                                    placeholder="País"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="date"
                                    value={item.deadline || ''}
                                    onChange={(e) => updateItemField(index, 'deadline', e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="text"
                                    value={item.price || ''}
                                    onChange={(e) => updateItemField(index, 'price', e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                                    placeholder="Fee / Arancel"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <input
                                    type="url"
                                    value={item.link || ''}
                                    onChange={(e) => updateItemField(index, 'link', e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                                    placeholder="Enlace o URL de postulación (https://...)"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {/* Título largo sin truncamiento */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="overflow-x-auto whitespace-normal break-words text-sm font-bold text-slate-800 pr-2 pb-0.5 max-w-[calc(100%-40px)]">
                                  {item.name || 'Festival sin título'}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingIndex(index);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-[#e91e63] hover:bg-pink-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                                  title="Editar festival (o haz doble tap)"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Metadatos en pastillas compactas */}
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                {isCandidateExpiredOrClosed(item) && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs">
                                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Convocatoria Vencida</span>
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{item.country || 'A confirmar'}</span>
                                </span>

                                {item.deadline && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Cierre: {item.deadline}</span>
                                  </span>
                                )}

                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{item.price || 'Gratis'}</span>
                                </span>

                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                                  <Film className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{item.category || 'Cortometraje'}</span>
                                </span>

                                {item.platform && (
                                  <span className="px-2 py-0.5 bg-pink-50 text-[#e91e63] font-bold text-[10px] rounded-md border border-pink-100">
                                    {item.platform}
                                  </span>
                                )}

                                {item.link && (
                                  <a
                                    href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg max-w-[200px] truncate transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">{item.link}</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Botón descartar */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(index);
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors flex-shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
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

            {/* Barra de acción ergonómica inferior con Hold-to-Confirm de 3 segundos */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isHolding}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                Cancelar
              </button>

              {/* Botón con confirmación Hold-to-Confirm de 3s */}
              <button
                type="button"
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                onTouchCancel={cancelHold}
                disabled={!isDistributor || selectedCount === 0 || isSubmitting}
                className={`relative overflow-hidden flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black shadow-lg transition-all select-none min-h-[44px] ${
                  isDistributor && selectedCount > 0 && !isSubmitting
                    ? holdProgress >= 100
                      ? 'bg-[#059669] text-white shadow-emerald-500/30'
                      : 'bg-[#e91e63] text-white shadow-pink-500/20 active:scale-[0.98]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
                title="Mantén presionado durante 3 segundos para confirmar la importación"
              >
                {/* Capa animada de llenado de progreso (0% a 100% en 3s hacia #059669) */}
                {isHolding && (
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-[#059669] transition-[width] duration-75 ease-linear pointer-events-none opacity-90"
                    style={{ width: `${holdProgress}%` }}
                  />
                )}

                {/* Contenido interactivo del botón sobre el fondo */}
                <div className="relative z-10 flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando en Proyecto...</span>
                    </>
                  ) : isHolding ? (
                    <>
                      <Clock className="w-4 h-4 animate-pulse" />
                      <span>Confirmando... {Math.round(holdProgress)}% (suelta para cancelar)</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Importar {selectedCount} {selectedCount === 1 ? 'Festival' : 'Festivales'} (Mantener 3s)</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {comparisonIndex !== null && items[comparisonIndex] && (
        <DuplicateComparisonView
          isOpen={true}
          onClose={() => setComparisonIndex(null)}
          candidate={items[comparisonIndex]}
          candidateIndex={comparisonIndex}
          onDiscardNew={removeItem}
          onUpdateExisting={handleUpdateExisting}
          onKeepBoth={handleKeepBoth}
          canEdit={isDistributor}
        />
      )}
    </AnimatePresence>
  );
};
