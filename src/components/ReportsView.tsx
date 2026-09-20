import React, { useState } from 'react';
import { differenceInDays, parseISO, isValid, startOfDay, endOfDay, format, startOfWeek, startOfMonth, subDays, subMonths } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { FileDown, FileText, Calendar, ShieldAlert, BarChart, Loader2, Mail, MapPinned, Settings2, Sparkles, Award, TrendingUp, Copy, Check, ClipboardCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../utils/helpers';
import { Festival, AuditLog, FestivalStatus } from '../types';
import { MapReportModal } from './MapReportModal';
import { PromptSummaryReportCard } from './PromptSummaryReportCard';
import { ExcelExportReportCard } from './ExcelExportReportCard';
import { exportPDF, PDFExportOptions } from '../utils/pdfExport';
import { generateIntelligentReportPDF } from '../utils/intelligentReportPDF';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { trackFirestoreReads } from '../utils/readCounters';

interface ReportsViewProps {
  festivals: Festival[];
  auditLogs: AuditLog[];
  onExportPDF: (options?: PDFExportOptions) => Promise<void>;
  onExportProjectionsPDF: () => Promise<void>;
  onExportAuditPDF: () => Promise<void>;
  onExportLaurelsPDF: () => Promise<void>;
  onExportStatsPDF: () => Promise<void>;
  onExportCSV: () => Promise<void>;
  setIsPdfModalOpen: (b: boolean) => void; // maybe we deprecate this
  userName: string;
  showToast?: (msg: string) => void;
}

const getFestivalTrajectoryTimestamp = (f: Festival): number => {
  if (f.projectionDate) {
    const d = new Date(f.projectionDate);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  if (f.deadline) {
    const d = new Date(f.deadline);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  if (f.updatedAt) {
    const d = new Date(f.updatedAt);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  if (f.createdAt) {
    const d = new Date(f.createdAt);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  return 0;
};

const isValidTrajectoryVal = (val?: string): boolean => {
  if (!val) return false;
  const clean = val.trim().toLowerCase();
  if (!clean) return false;
  const invalidPlaceholders = ['ninguna', 'ninguno', 'n/a', '-', 'ningun', 'sin categoria', 'sin categoría', 'ningun premio'];
  return !invalidPlaceholders.includes(clean);
};

const generateTrajectoryText = (
  festivals: Festival[],
  selectedStatuses: string[],
  selectedTypes: string[],
  formatStyle: 'bullets' | 'numbered' | 'inline' | 'markdown',
  includeCountry: boolean,
  includeYear: boolean,
  includeCategory: boolean,
  includeAward: boolean,
  sortOrder: 'desc' | 'asc' = 'desc'
): string => {
  const filtered = festivals.filter(f => {
    if (f.includeInStats === false) return false;
    const statusMatch = selectedStatuses.includes(f.status);
    if (!statusMatch) return false;

    if (selectedTypes && selectedTypes.length > 0) {
      const fType = f.type || 'Festival🎬';
      const matchesType = selectedTypes.some(st => {
        if (fType === st) return true;
        const cleanSt = st.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ]/g, '').toLowerCase();
        const cleanFType = fType.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ]/g, '').toLowerCase();
        return cleanFType.includes(cleanSt) || cleanSt.includes(cleanFType);
      });
      if (!matchesType) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    return 'No se encontraron festivales con los filtros seleccionados.';
  }

  // Ordenar según fecha (priorizando projectionDate)
  const sorted = [...filtered].sort((a, b) => {
    const timeA = getFestivalTrajectoryTimestamp(a);
    const timeB = getFestivalTrajectoryTimestamp(b);
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const items = sorted.map((f) => {
    let name = f.name?.trim() || 'Festival Sin Nombre';
    const parts: string[] = [];
    
    if (includeCountry && f.country) {
      parts.push(f.country.trim());
    }
    if (includeYear) {
      if (f.projectionDate) {
        // Formato dd/mm/aaaa
        const dateOnly = f.projectionDate.split('T')[0];
        const partsDate = dateOnly.split('-');
        if (partsDate.length === 3 && partsDate[0] && partsDate[1] && partsDate[2]) {
          const [y, m, d] = partsDate;
          parts.push(`${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`);
        } else {
          const d = new Date(f.projectionDate);
          if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            parts.push(`${day}/${month}/${year}`);
          }
        }
      } else {
        // Sin fecha de proyección: incorporar solo el año de creación/convocatoria
        let yearVal: number | null = null;
        if (f.deadline) {
          const d = new Date(f.deadline);
          if (!isNaN(d.getTime())) yearVal = d.getFullYear();
        }
        if (!yearVal && f.statusHistory && f.statusHistory.length > 0 && f.statusHistory[0].timestamp) {
          const d = new Date(f.statusHistory[0].timestamp);
          if (!isNaN(d.getTime())) yearVal = d.getFullYear();
        }
        if (!yearVal) {
          yearVal = new Date().getFullYear();
        }
        if (yearVal) {
          parts.push(yearVal.toString());
        }
      }
    }
    if (includeCategory && isValidTrajectoryVal(f.category)) {
      parts.push(f.category!.trim());
    }
    if (includeAward) {
      const hasValidNomination = isValidTrajectoryVal(f.nomination);
      if (hasValidNomination) {
        parts.push(`🏆 ${f.nomination!.trim()}`);
      } else if (f.status === FestivalStatus.GANADO) {
        parts.push('🏆 Ganador');
      }
    }

    const meta = parts.length > 0 ? ` (${parts.join(', ')})` : '';
    return `${name}${meta}`;
  });

  if (formatStyle === 'inline') {
    return items.join(' | ');
  } else if (formatStyle === 'numbered') {
    return items.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
  } else if (formatStyle === 'markdown') {
    return items.map((item) => `- ${item}`).join('\n');
  } else {
    return items.map((item) => `• ${item}`).join('\n');
  }
};

export const ReportsView: React.FC<ReportsViewProps> = ({
  festivals,
  auditLogs,
  onExportPDF,
  onExportProjectionsPDF,
  onExportAuditPDF,
  onExportLaurelsPDF,
  onExportStatsPDF,
  onExportCSV,
  setIsPdfModalOpen, // deprecated likely
  userName,
  showToast
}) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingProj, setIsExportingProj] = useState(false);
  const [isExportingAudit, setIsExportingAudit] = useState(false);
  const [isExportingLaurels, setIsExportingLaurels] = useState(false);
  const [isExportingStats, setIsExportingStats] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Intelligent report states
  const [isIntelExpanded, setIsIntelExpanded] = useState(false);
  const [intelDateFrom, setIntelDateFrom] = useState('');
  const [intelDateTo, setIntelDateTo] = useState('');
  const [intelPageSize, setIntelPageSize] = useState<'a4' | 'a3'>('a4');
  const [intelOrientation, setIntelOrientation] = useState<'p' | 'l'>('p');
  const [isGeneratingIntel, setIsGeneratingIntel] = useState(false);

  const [pdfOptions, setPdfOptions] = useState<PDFExportOptions>({
    pageSize: 'a4',
    orientation: 'p',
    sortBy: 'normal',
    includeObservations: true,
    onlyPendingToSubmit: false,
  });

  // Trajectory Copy states
  const [trajStatuses, setTrajStatuses] = useState<string[]>([
    FestivalStatus.SELECCIONADO,
    FestivalStatus.PROYECTADO,
    FestivalStatus.GANADO
  ]);
  const [trajTypes, setTrajTypes] = useState<string[]>([
    'Festival🎬',
    'Premios🏆',
    'Muestra🎞️'
  ]);
  const [trajFormatStyle, setTrajFormatStyle] = useState<'bullets' | 'numbered' | 'inline' | 'markdown'>('bullets');
  const [trajSortOrder, setTrajSortOrder] = useState<'desc' | 'asc'>('desc');
  const [trajIncludeCountry, setTrajIncludeCountry] = useState(true);
  const [trajIncludeYear, setTrajIncludeYear] = useState(true);
  const [trajIncludeCategory, setTrajIncludeCategory] = useState(true);
  const [trajIncludeAward, setTrajIncludeAward] = useState(true);
  const [trajCopied, setTrajCopied] = useState(false);

  const toggleTrajStatus = (status: string) => {
    setTrajStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleTrajType = (typeKey: string) => {
    setTrajTypes(prev =>
      prev.includes(typeKey) ? prev.filter(t => t !== typeKey) : [...prev, typeKey]
    );
  };

  const currentTrajText = generateTrajectoryText(
    festivals,
    trajStatuses,
    trajTypes,
    trajFormatStyle,
    trajIncludeCountry,
    trajIncludeYear,
    trajIncludeCategory,
    trajIncludeAward,
    trajSortOrder
  );

  const trajMatchesCount = festivals.filter(f => {
    const statusMatch = trajStatuses.includes(f.status);
    if (!statusMatch) return false;

    if (trajTypes && trajTypes.length > 0) {
      const fType = f.type || 'Festival🎬';
      const matchesType = trajTypes.some(st => {
        if (fType === st) return true;
        const cleanSt = st.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ]/g, '').toLowerCase();
        const cleanFType = fType.replace(/[^a-zA-ZáéíóúÁÉÍÓÚ]/g, '').toLowerCase();
        return cleanFType.includes(cleanSt) || cleanSt.includes(cleanFType);
      });
      if (!matchesType) return false;
    }

    return true;
  }).length;

  const handleCopyTrajectory = () => {
    navigator.clipboard.writeText(currentTrajText).then(() => {
      setTrajCopied(true);
      if (showToast) {
        showToast("¡Trayectoria copiada al portapapeles! 🎬");
      }
      setTimeout(() => setTrajCopied(false), 2000);
    }).catch(() => {
      if (showToast) {
        showToast("Error al copiar trayectoria");
      }
    });
  };

  const handleQuickRange = (rangeType: 'semana' | 'mes' | '60dias' | '90dias' | '6meses') => {
    const today = new Date();
    let start: Date;
    const end = today;

    switch (rangeType) {
      case 'semana':
        start = startOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'mes':
        start = startOfMonth(today);
        break;
      case '60dias':
        start = subDays(today, 60);
        break;
      case '90dias':
        start = subDays(today, 90);
        break;
      case '6meses':
        start = subMonths(today, 6);
        break;
      default:
        return;
    }

    setIntelDateFrom(format(start, 'yyyy-MM-dd'));
    setIntelDateTo(format(end, 'yyyy-MM-dd'));
  };

  const generateIntelligentReport = async () => {
    if (!intelDateFrom || !intelDateTo) {
        alert("Debes seleccionar una 'Fecha Desde' y 'Fecha Hasta' obligatorias para el reporte inteligente.");
        return;
    }
    
    const start = parseISO(intelDateFrom);
    const end = parseISO(intelDateTo);
    
    if (!isValid(start) || !isValid(end)) {
        alert("Las fechas ingresadas no son válidas.");
        return;
    }
    
    const diff = differenceInDays(end, start);
    if (diff < 1) {
        alert("El periodo mínimo para el reporte inteligente es de 1 día.");
        return;
    }
    if (diff > 180) {
        alert("El periodo máximo para el reporte inteligente es de 6 meses (180 días) por motivos de rendimiento.");
        return;
    }

    setIsGeneratingIntel(true);
    try {
      const queryStart = startOfDay(start).toISOString();
      const queryEnd = endOfDay(end).toISOString();
      
      const q = query(
        collection(db, "auditlogs"),
        where("timestamp", ">=", queryStart),
        where("timestamp", "<=", queryEnd),
        orderBy("timestamp", "asc")
      );
      
      const snapshot = await getDocs(q);
      trackFirestoreReads(snapshot.docs.length);
      const realAuditLogs: AuditLog[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));

      await generateIntelligentReportPDF(festivals, realAuditLogs, userName, {
        pageSize: intelPageSize,
        orientation: intelOrientation,
        dateFrom: intelDateFrom,
        dateTo: intelDateTo
      });

    } catch (e: any) {
      alert("Error generating report: " + e.message);
    } finally {
      setIsGeneratingIntel(false);
    }
  };

  const handleAsyncExport = async (exportFn: () => Promise<void>, loadingSetter: (v: boolean) => void) => {
    loadingSetter(true);
    try {
      await exportFn();
    } finally {
      loadingSetter(false);
    }
  };

  return (
    <div className="space-y-6 pb-32 pt-6">
      <header className="flex flex-col gap-2 text-center max-w-lg mx-auto">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <FileDown className="h-16 w-16 text-[#e91e63] absolute top-0 left-0" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }} 
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 bg-[#e91e63] rounded-full absolute top-0 left-0 blur-xl -z-10"
          />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 leading-none">
          Informes
        </h2>
        <p className="text-slate-600 text-xs font-semibold mt-2">
          Generador de documentos
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* INFORME INTELIGENTE / A DETALLE (COLLAPSIBLE DROPDOWN) */}
        <div className="col-span-1 md:col-span-2 glass-card p-5 sm:p-6 space-y-4 hover:shadow-lg transition-shadow border-t-4 border-t-indigo-500">
          <div 
            onClick={() => setIsIntelExpanded(prev => !prev)}
            className="flex justify-between items-center cursor-pointer select-none group"
          >
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-105 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                     Informe a detalle <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full lowercase">en progreso</span>
                   </h3>
                   <p className="text-[10px] text-slate-500 font-medium">Reporte ejecutivo semanal o mensual en PDF.</p>
                </div>
             </div>
             
             <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-700 transition-all border border-slate-200">
                {isIntelExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
             </div>
          </div>

          <AnimatePresence>
            {isIntelExpanded && (
              <motion.div
                key="intel-report-body"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="space-y-4 pt-2 overflow-hidden border-t border-slate-100 mt-2"
              >
                <p className="text-[10px] leading-relaxed text-slate-600 font-medium">
                   Genera un informe detallado analizando festivales por cerrar, extensiones de plazo, noticias recientes, selecciones y proyecciones. Todo organizado automáticamente.
                </p>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-4">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] uppercase font-bold tracking-wider text-slate-600">
                     <div className="space-y-1.5">
                        <label className="block text-slate-700 font-semibold">Tamaño de Hoja</label>
                        <select 
                           className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                           value={intelPageSize}
                           onChange={(e) => setIntelPageSize(e.target.value as any)}
                        >
                           <option value="a4">A4</option>
                           <option value="a3">A3</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="block text-slate-700 font-semibold">Orientación</label>
                        <select 
                           className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                           value={intelOrientation}
                           onChange={(e) => setIntelOrientation(e.target.value as any)}
                        >
                           <option value="p">Vertical</option>
                           <option value="l">Horizontal</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="block text-slate-700 font-semibold">Fecha Desde (Requerido)</label>
                        <input type="date" 
                           className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none"
                           value={intelDateFrom}
                           onChange={(e) => setIntelDateFrom(e.target.value)}
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="block text-slate-700 font-semibold">Fecha Hasta (Requerido)</label>
                        <input type="date" 
                           className="w-full bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none"
                           value={intelDateTo}
                           onChange={(e) => setIntelDateTo(e.target.value)}
                        />
                     </div>
                   </div>
                   
                   <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                     <div className="text-xs text-slate-600 font-medium leading-relaxed">
                       * El rango de fechas seleccionado puede ser de 1 día hasta 6 meses (180 días) de duración.
                      </div>
                      <div className="flex flex-col gap-1.5 my-1">
                         <span className="text-xs font-bold text-slate-700">Rangos rápidos de análisis</span>
                         <div className="flex flex-wrap gap-1.5">
                            <button
                               type="button"
                               onClick={() => handleQuickRange('semana')}
                               className="px-2 py-1 text-[8.5px] font-bold uppercase tracking-wider rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                            >
                               Semana Actual
                            </button>
                            <button
                               type="button"
                               onClick={() => handleQuickRange('mes')}
                               className="px-2 py-1 text-[8.5px] font-bold uppercase tracking-wider rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                            >
                               Mes Actual
                            </button>
                            <button
                               type="button"
                               onClick={() => handleQuickRange('60dias')}
                               className="px-2 py-1 text-[8.5px] font-bold uppercase tracking-wider rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                            >
                               Últimos 60 Días
                            </button>
                            <button
                               type="button"
                               onClick={() => handleQuickRange('90dias')}
                               className="px-2 py-1 text-[8.5px] font-bold uppercase tracking-wider rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                            >
                               Últimos 90 Días
                            </button>
                            <button
                               type="button"
                               onClick={() => handleQuickRange('6meses')}
                               className="px-2 py-1 text-[8.5px] font-bold uppercase tracking-wider rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                            >
                               Últimos 6 Meses
                            </button>
                         </div>
                      </div>
                      <button 
                         onClick={generateIntelligentReport} 
                         disabled={isGeneratingIntel || !intelDateFrom || !intelDateTo}
                         className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-600/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mt-1"
                      >
                         {isGeneratingIntel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                         {isGeneratingIntel ? 'Generando Documento...' : 'Descargar Informe a detalle'}
                      </button>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="glass-card p-6 space-y-4 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-[#e91e63] shadow-inner">
                  <BarChart className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Informe General</h3>
                   <p className="text-[10px] text-slate-500 font-medium">Todos los festivales y su estado.</p>
                </div>
             </div>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-600 font-medium">
             Genera un documento PDF detallado con la lista completa de todos los festivales cargados en la plataforma, agrupados por su estado (Seleccionado, Rechazado, etc.).
          </p>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-4">
             <div className="grid grid-cols-2 gap-3 text-[10px] uppercase font-bold tracking-wider text-slate-600">
               <div className="space-y-1.5">
                  <label className="block text-slate-700 font-semibold">Tamaño de Hoja</label>
                  <select 
                     className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                     value={pdfOptions.pageSize}
                     onChange={(e) => setPdfOptions(p => ({ ...p, pageSize: e.target.value as any }))}
                  >
                     <option value="a4">A4</option>
                     <option value="a3">A3</option>
                     <option value="legal">Oficio</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="block text-slate-400">Orientación</label>
                  <select 
                     className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                     value={pdfOptions.orientation}
                     onChange={(e) => setPdfOptions(p => ({ ...p, orientation: e.target.value as any }))}
                  >
                     <option value="p">Vertical</option>
                     <option value="l">Horizontal</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="block text-slate-400">Ordenar Por</label>
                  <select 
                     className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                     value={pdfOptions.sortBy}
                     onChange={(e) => setPdfOptions(p => ({ ...p, sortBy: e.target.value as any }))}
                  >
                     <option value="normal">Normal</option>
                     <option value="estado">Estado</option>
                     <option value="fecha">Fecha de Cierre</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="block text-slate-400">Observaciones</label>
                  <select 
                     className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none"
                     value={pdfOptions.includeObservations ? 'si' : 'no'}
                     onChange={(e) => setPdfOptions(p => ({ ...p, includeObservations: e.target.value === 'si' }))}
                  >
                     <option value="si">Incluir</option>
                     <option value="no">Excluir</option>
                  </select>
               </div>
             </div>
             
             <div className="flex items-start gap-2.5 p-3 bg-pink-50/50 border border-pink-100 rounded-xl mb-4">
                <input 
                   type="checkbox" 
                   id="onlyPendingToSubmit"
                   className="mt-0.5 h-4 w-4 text-pink-600 focus:ring-pink-500 border-slate-300 rounded cursor-pointer accent-pink-600"
                   checked={pdfOptions.onlyPendingToSubmit || false}
                   onChange={(e) => setPdfOptions(p => ({ ...p, onlyPendingToSubmit: e.target.checked }))}
                />
                <label htmlFor="onlyPendingToSubmit" className="text-[10px] font-bold uppercase tracking-wide text-slate-700 cursor-pointer select-none leading-relaxed">
                   Solo festivales pendientes por enviar <span className="block text-pink-600 font-extrabold">(Convocatoria Abierta)</span>
                </label>
             </div>

             <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
               <button 
                  onClick={() => handleAsyncExport(() => onExportPDF(pdfOptions), setIsExportingPDF)} 
                  disabled={isExportingPDF}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
               >
                  {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}
                  {isExportingPDF ? 'Procesando...' : 'Generar PDF Personalizado'}
               </button>

               <button 
                  onClick={() => handleAsyncExport(() => onExportPDF(), setIsExportingPDF)} 
                  disabled={isExportingPDF}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white text-[10px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all shadow-md shadow-pink-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                  {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {isExportingPDF ? 'Procesando...' : 'Generar con ajustes por defecto'}
               </button>
             </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
             <button 
                onClick={() => handleAsyncExport(onExportCSV, setIsExportingCSV)}
                disabled={isExportingCSV}
                className="bg-slate-100 hover:bg-slate-200 disabled:opacity-70 disabled:hover:bg-slate-100 disabled:cursor-not-allowed text-slate-700 text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 font-bold transition-colors min-w-[120px] justify-center w-full"
             >
                {isExportingCSV ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
                {isExportingCSV ? 'Procesando...' : 'Descargar CSV'}
             </button>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
               <Calendar className="h-5 w-5" />
             </div>
             <div>
                <h3 className="text-xs font-bold text-slate-800">Proyecciones</h3>
                <p className="text-xs text-slate-600 font-medium">Fechas de screening y detalles.</p>
             </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 font-medium">
             Genera un documento que incluye los festivales agendados en el calendario de proyecciones, con sus coordenadas, ubicación, formato de proyección y estado de asistencia.
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
             <button 
                onClick={() => handleAsyncExport(onExportProjectionsPDF, setIsExportingProj)} 
                disabled={isExportingProj}
                className="btn-secondary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 min-w-[120px] justify-center disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {isExportingProj ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                {isExportingProj ? 'Procesando...' : 'Descargar PDF'}
             </button>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 shadow-inner">
               <ShieldAlert className="h-5 w-5" />
             </div>
             <div>
                <h3 className="text-xs font-bold text-slate-800">Auditoría / Logs</h3>
                <p className="text-xs text-slate-600 font-medium">Historial completo del equipo.</p>
             </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 font-medium">
             Extrae todo el registro de movimientos, inicios de sesión y modificaciones críticas realizadas por los integrantes del equipo.
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
             <button 
                onClick={() => handleAsyncExport(onExportAuditPDF, setIsExportingAudit)} 
                disabled={isExportingAudit}
                className="btn-secondary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 min-w-[120px] justify-center disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {isExportingAudit ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                {isExportingAudit ? 'Procesando...' : 'Descargar PDF'}
             </button>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
               <MapPinned className="h-5 w-5" />
             </div>
             <div>
                <h3 className="text-xs font-bold text-slate-800">Mapa Geográfico</h3>
                <p className="text-xs text-slate-600 font-medium">Marcadores y siluetas por país.</p>
             </div>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-600 font-medium">
             Genera un mapa en PDF de un país específico. Muestra el territorio nacional en color plano, incluye a los países limítrofes como referencia, y posiciona a los festivales proyectados utilizando coodenadas.
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
             <button 
                onClick={() => setIsMapModalOpen(true)}
                className="btn-secondary text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1 min-w-[120px] justify-center"
             >
                <MapPinned className="h-3 w-3" /> Abrir Generador
             </button>
          </div>
        </div>

        {/* INFORME DE LAURELES */}
        <div className="glass-card p-6 space-y-4 hover:shadow-lg transition-shadow border-t-4 border-t-amber-500">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
               <Award className="h-5 w-5" />
             </div>
             <div>
                <h3 className="text-xs font-bold text-slate-800">Laureles y Selecciones</h3>
                <p className="text-xs text-slate-600 font-medium">Dosier de laureles oficiales.</p>
             </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 font-medium">
             Genera un dosier visual imprimible tipo portfolio con los laureles y galardones obtenidos por la obra, ideal para prensa, inversores o redes sociales.
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
             <button 
                onClick={() => handleAsyncExport(onExportLaurelsPDF, setIsExportingLaurels)} 
                disabled={isExportingLaurels}
                className="btn-secondary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 min-w-[120px] justify-center disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {isExportingLaurels ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                {isExportingLaurels ? 'Procesando...' : 'Descargar PDF'}
             </button>
          </div>
        </div>

        {/* INFORME DE ESTADÍSTICAS */}
        <div className="glass-card p-6 space-y-4 hover:shadow-lg transition-shadow border-t-4 border-t-teal-500">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-inner">
               <TrendingUp className="h-5 w-5" />
             </div>
             <div>
                <div className="flex items-center gap-2">
                   <h3 className="text-xs font-bold text-slate-800">Estadísticas de Rendimiento</h3>
                   <span className="text-[10px] px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold border border-teal-200">En progreso</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Métricas analíticas avanzadas.</p>
             </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 font-medium">
             Genera un informe ejecutivo consolidando la tasa de éxito de postulaciones por plataforma, géneros dominantes, top países de destino y estimación de costos.
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
             <button 
                onClick={() => handleAsyncExport(onExportStatsPDF, setIsExportingStats)} 
                disabled={isExportingStats}
                className="btn-secondary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 min-w-[120px] justify-center disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {isExportingStats ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                {isExportingStats ? 'Procesando...' : 'Descargar PDF'}
             </button>
          </div>
        </div>

        {/* COPIA DE TRAYECTORIA / SELECCIONES */}
        <div className="col-span-1 md:col-span-2 glass-card p-6 space-y-4 hover:shadow-lg transition-shadow border-t-4 border-t-emerald-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="text-xs font-bold text-slate-800">
                     Copia de Trayectoria / Selecciones
                   </h3>
                   <p className="text-xs text-slate-600 font-medium">
                     Genera una lista resumida para dossier, redes sociales o agentes de IA.
                   </p>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {trajMatchesCount} {trajMatchesCount === 1 ? 'Festival' : 'Festivales'}
                </span>
             </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-4">
             {/* Opciones de Tipo */}
             <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Tipo de Inscripción / Evento
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'Festival🎬', label: '🎬 Festivales' },
                    { key: 'Premios🏆', label: '🏆 Premios' },
                    { key: 'Muestra🎞️', label: '🎞️ Muestras' }
                  ].map((typeObj) => {
                    const isChecked = trajTypes.includes(typeObj.key);
                    return (
                      <button
                        key={`traj-tp-${typeObj.key}`}
                        type="button"
                        onClick={() => toggleTrajType(typeObj.key)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5",
                          isChecked
                            ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                        {typeObj.label}
                      </button>
                    );
                  })}
                </div>
             </div>

             {/* Opciones de Estado */}
             <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Estados a incluir
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    FestivalStatus.SELECCIONADO,
                    FestivalStatus.PROYECTADO,
                    FestivalStatus.GANADO,
                    FestivalStatus.EN_REVISION,
                    FestivalStatus.POR_ENVIAR
                  ].map((st) => {
                    const isChecked = trajStatuses.includes(st);
                    return (
                      <button
                        key={`traj-st-${st}`}
                        type="button"
                        onClick={() => toggleTrajStatus(st)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5",
                          isChecked
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                        {st}
                      </button>
                    );
                  })}
                </div>
             </div>

             {/* Formato y Opciones */}
             <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3 text-[10px] uppercase font-bold tracking-wider text-slate-600">
               <div className="space-y-1.5">
                  <label className="block text-slate-400">Estilo de lista</label>
                  <select 
                     className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none text-[10px] font-bold"
                     value={trajFormatStyle}
                     onChange={(e) => setTrajFormatStyle(e.target.value as any)}
                  >
                     <option value="bullets">• Viñetas (•)</option>
                     <option value="numbered">1. Numerado (1, 2, 3)</option>
                     <option value="inline">| En una sola línea</option>
                     <option value="markdown">- Markdown (-)</option>
                  </select>
               </div>

               <div className="space-y-1.5">
                  <label className="block text-slate-400">Orden de fechas</label>
                  <select 
                     className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none text-[10px] font-bold"
                     value={trajSortOrder}
                     onChange={(e) => setTrajSortOrder(e.target.value as any)}
                  >
                     <option value="desc">↓ Reciente a antigua</option>
                     <option value="asc">↑ Antigua a reciente</option>
                  </select>
               </div>

               <div className="space-y-1.5">
                  <label className="block text-slate-400 font-bold">Incluir País</label>
                  <button
                     type="button"
                     onClick={() => setTrajIncludeCountry(!trajIncludeCountry)}
                     className={cn(
                        "w-full p-2 rounded-lg text-[10px] font-black uppercase tracking-wider border text-left transition-colors",
                        trajIncludeCountry ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-400 border-slate-200"
                     )}
                  >
                     {trajIncludeCountry ? "✓ País Incluido" : "✕ Omitir País"}
                  </button>
               </div>

               <div className="space-y-1.5">
                  <label className="block text-slate-400 font-bold">Incluir Fecha / Año</label>
                  <button
                     type="button"
                     onClick={() => setTrajIncludeYear(!trajIncludeYear)}
                     className={cn(
                        "w-full p-2 rounded-lg text-[10px] font-black uppercase tracking-wider border text-left transition-colors",
                        trajIncludeYear ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-400 border-slate-200"
                     )}
                  >
                     {trajIncludeYear ? "✓ Fecha / Año Incluido" : "✕ Omitir Fecha / Año"}
                  </button>
               </div>

               <div className="space-y-1.5">
                  <label className="block text-slate-400 font-bold">Incluir Categoría</label>
                  <button
                     type="button"
                     onClick={() => setTrajIncludeCategory(!trajIncludeCategory)}
                     className={cn(
                        "w-full p-2 rounded-lg text-[10px] font-black uppercase tracking-wider border text-left transition-colors",
                        trajIncludeCategory ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-400 border-slate-200"
                     )}
                  >
                     {trajIncludeCategory ? "✓ Categoría Incluida" : "✕ Omitir Categoría"}
                  </button>
               </div>

               <div className="space-y-1.5">
                  <label className="block text-slate-400 font-bold">Incluir Premio/Nominación</label>
                  <button
                     type="button"
                     onClick={() => setTrajIncludeAward(!trajIncludeAward)}
                     className={cn(
                        "w-full p-2 rounded-lg text-[10px] font-black uppercase tracking-wider border text-left transition-colors",
                        trajIncludeAward ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-400 border-slate-200"
                     )}
                  >
                     {trajIncludeAward ? "✓ Premios Incluidos" : "✕ Omitir Premios"}
                  </button>
               </div>
             </div>

             {/* Live Preview Box */}
             <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                   <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                     Vista previa del texto generado
                   </label>
                   <span className="text-[9px] text-slate-400 font-mono">
                     {currentTrajText.length} caracteres
                   </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3 max-h-36 overflow-y-auto font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                   {currentTrajText}
                </div>
             </div>

             {/* Copy Button */}
             <button 
                type="button"
                onClick={handleCopyTrajectory} 
                className={cn(
                  "w-full text-[10px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all shadow-md cursor-pointer",
                  trajCopied
                    ? "bg-emerald-500 text-white shadow-emerald-500/20 scale-[1.01]"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                )}
             >
                {trajCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {trajCopied ? "¡Trayectoria Copiada!" : "Copiar Trayectoria al Portapapeles"}
             </button>
          </div>
        </div>

        {/* RESUMEN PARA PROMPTS DE IA (UBICADO ABAJO DEL TODO EN FORMA DE DROP-DOWN) */}
        <PromptSummaryReportCard 
          festivals={festivals} 
          userName={userName} 
          showToast={showToast} 
        />

        {/* INFORME DE EXPORTACIÓN A EXCEL / CSV (DESPLEGABLE DROP-DOWN) */}
        <ExcelExportReportCard 
          festivals={festivals} 
          showToast={showToast} 
        />

      </div>

      <MapReportModal 
        isOpen={isMapModalOpen} 
        onClose={() => setIsMapModalOpen(false)} 
        festivals={festivals} 
        userName={userName} 
      />
    </div>
  );
};
