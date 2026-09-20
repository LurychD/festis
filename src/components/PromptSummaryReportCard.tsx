import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Sparkles, Copy, Check, FileDown, Calendar, 
  AlertTriangle, Filter, CheckSquare, RefreshCw, Layers, Sliders, ShieldAlert, Code,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { subDays, parseISO, isValid, isAfter, isBefore, startOfDay, endOfDay, format } from 'date-fns';
import { cn } from '../utils/helpers';
import { Festival, FestivalStatus } from '../types';

interface PromptSummaryReportCardProps {
  festivals: Festival[];
  userName?: string;
  showToast?: (msg: string) => void;
}

type TimeRangeType = 'hoy' | 'semana' | 'mes' | '60dias' | '90dias' | 'todos' | 'personalizado';
type OutputFormatType = 'md' | 'txt' | 'pdf';
type PromptPresetType = 'limpio' | 'analisis' | 'resumen_ejecutivo' | 'pendientes';

export const PromptSummaryReportCard: React.FC<PromptSummaryReportCardProps> = ({
  festivals,
  userName = 'Usuario',
  showToast
}) => {
  // Collapsible Dropdown State
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Time Range & Filter States
  const [timeRange, setTimeRange] = useState<TimeRangeType>('semana'); // Default: semanal
  const [customDays, setCustomDays] = useState<number>(14);
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');
  
  // Format & Preset States
  const [outputFormat, setOutputFormat] = useState<OutputFormatType>('md');
  const [promptPreset, setPromptPreset] = useState<PromptPresetType>('limpio');

  // Option Toggles
  const [includeObservations, setIncludeObservations] = useState<boolean>(true);
  const [includeChecklist, setIncludeChecklist] = useState<boolean>(true);
  const [includeStatusHistory, setIncludeStatusHistory] = useState<boolean>(false);
  const [includeLinks, setIncludeLinks] = useState<boolean>(true);
  const [includeEditions, setIncludeEditions] = useState<boolean>(true);
  const [autoCompact, setAutoCompact] = useState<boolean>(false);

  // Status Filter Selection
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    FestivalStatus.POR_ENVIAR,
    FestivalStatus.PROXIMAMENTE,
    FestivalStatus.EN_REVISION,
    FestivalStatus.SELECCIONADO,
    FestivalStatus.PROYECTADO,
    FestivalStatus.GANADO,
    FestivalStatus.NO_SELECCIONADO,
    FestivalStatus.EN_DUDA
  ]);

  // Copy Feedback
  const [copied, setCopied] = useState<boolean>(false);

  // Quick Status Presets
  const handleSelectAllStatuses = () => {
    setSelectedStatuses(Object.values(FestivalStatus));
  };

  const handleSelectPendingStatuses = () => {
    setSelectedStatuses([
      FestivalStatus.POR_ENVIAR,
      FestivalStatus.PROXIMAMENTE,
      FestivalStatus.EN_REVISION,
      FestivalStatus.EN_DUDA
    ]);
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  // Filter festivals based on selected Time Range & Statuses
  const filteredFestivals = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    
    return festivals.filter(f => {
      // 1. Status Filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(f.status)) {
        return false;
      }

      // 2. Time Range Filter
      if (timeRange === 'todos') return true;

      // Determine date to compare (deadline or projectionDate or createdAt)
      let targetDateStr = f.deadline || f.projectionDate;
      if (!targetDateStr && f.statusHistory && f.statusHistory.length > 0) {
        targetDateStr = f.statusHistory[0].timestamp;
      }

      if (!targetDateStr) return true; // Include if no date is set to avoid losing items

      const parsedDate = parseISO(targetDateStr);
      if (!isValid(parsedDate)) return true;

      if (timeRange === 'hoy') {
        const diffInDays = Math.abs(differenceInCalendarDays(todayStart, startOfDay(parsedDate)));
        return diffInDays <= 1;
      } else if (timeRange === 'semana') {
        const cutoff = subDays(todayStart, 7);
        return isAfter(parsedDate, cutoff) || isSameDayOrFuture(parsedDate, todayStart);
      } else if (timeRange === 'mes') {
        const cutoff = subDays(todayStart, 30);
        return isAfter(parsedDate, cutoff) || isSameDayOrFuture(parsedDate, todayStart);
      } else if (timeRange === '60dias') {
        const cutoff = subDays(todayStart, 60);
        return isAfter(parsedDate, cutoff) || isSameDayOrFuture(parsedDate, todayStart);
      } else if (timeRange === '90dias') {
        const cutoff = subDays(todayStart, 90);
        return isAfter(parsedDate, cutoff) || isSameDayOrFuture(parsedDate, todayStart);
      } else if (timeRange === 'personalizado') {
        if (customDateFrom && customDateTo) {
          const from = startOfDay(parseISO(customDateFrom));
          const to = endOfDay(parseISO(customDateTo));
          if (isValid(from) && isValid(to)) {
            return (isAfter(parsedDate, from) || parsedDate.getTime() === from.getTime()) &&
                   (isBefore(parsedDate, to) || parsedDate.getTime() === to.getTime());
          }
        } else if (customDays > 0) {
          const cutoff = subDays(todayStart, customDays);
          return isAfter(parsedDate, cutoff) || isSameDayOrFuture(parsedDate, todayStart);
        }
      }

      return true;
    });
  }, [festivals, selectedStatuses, timeRange, customDays, customDateFrom, customDateTo]);

  // Generate Prompt / Summary Text
  const summaryText = useMemo(() => {
    const totalCount = filteredFestivals.length;
    const dateNow = format(new Date(), 'dd/MM/yyyy HH:mm');

    let output = '';

    // Add Prompt Preset Header if configured
    if (promptPreset === 'analisis') {
      output += `Actúa como un Consultor Estratégico de Distribución Cinematográfica y Curador de Festivales. Analiza detenidamente el siguiente resumen de convocatorias y festivales de mi proyecto cinematográfico. Evalúa prioridades, próximos vencimientos, requisitos pendientes y sugiere un plan de acción optimizado.\n\n`;
    } else if (promptPreset === 'resumen_ejecutivo') {
      output += `Actúa como un Productor Ejecutivo. Analiza el siguiente reporte consolidado de festivales de cine. Genera un resumen ejecutivo de estado general de postulaciones, métricas de selecciones/rechazos y los próximos hitos clave.\n\n`;
    } else if (promptPreset === 'pendientes') {
      output += `Analiza la lista de convocatorias y checklist de seguimiento adjuntas. Identifica todas las tareas pendientes, requisitos incompletos y convocatorias por vencer ordenadas por urgencia, sugiriendo un calendario diario de trabajo.\n\n`;
    }

    // Document Header
    output += `# RESUMEN CONSOLIDADO DE FESTIVALES DE CINE - FESTIS\n`;
    output += `Generado el: ${dateNow} | Registros incluidos: ${totalCount}\n`;
    output += `Rango de análisis: ${getTimeRangeLabel(timeRange, customDays, customDateFrom, customDateTo)}\n`;
    output += `================================================================================\n\n`;

    if (totalCount === 0) {
      output += `No se encontraron festivales que coincidan con el rango de fechas y filtros seleccionados.\n`;
      return output;
    }

    // Group festivals by Status
    const grouped: Record<string, Festival[]> = {};
    filteredFestivals.forEach(f => {
      const st = f.status || 'OTRO';
      if (!grouped[st]) grouped[st] = [];
      grouped[st].push(f);
    });

    // Overview Stats Section
    output += `## 📊 RESUMEN POR ESTADO DE POSTULACIÓN\n`;
    Object.keys(grouped).forEach(st => {
      output += `- ${st}: ${grouped[st].length} festival(es)\n`;
    });
    output += `\n================================================================================\n\n`;

    // Individual Festival Details
    output += `## 🎬 FICHA DETALLADA DE FESTIVALES (${totalCount})\n\n`;

    filteredFestivals.forEach((f, index) => {
      output += `### ${index + 1}. ${f.name?.toUpperCase() || 'FESTIVAL SIN NOMBRE'}\n`;
      output += `- Estado Actual: [ ${f.status} ]\n`;
      if (f.country) output += `- País / Ubicación: ${f.country}\n`;
      if ((f as any).city) output += `- Ciudad: ${(f as any).city}\n`;
      if (f.deadline) output += `- Fecha Límite de Inscribir: ${formatDate(f.deadline)}\n`;
      if (f.projectionDate) output += `- Fecha de Proyección / Celebración: ${formatDate(f.projectionDate)}\n`;
      if (f.category) output += `- Categoría: ${f.category}\n`;
      if (f.fee !== undefined && f.fee !== null && String(f.fee) !== '') output += `- Tarifa / Fee: ${f.fee}\n`;
      if (f.platform) output += `- Plataforma: ${f.platform}\n`;

      if (includeLinks) {
        const primaryLink = f.link || (f as any).website || (f as any).directUrl || (f as any).url || (f as any).linkUrl;
        if (primaryLink) output += `- Enlace / Sitio Web: ${primaryLink}\n`;
        if (f.link && (f as any).directUrl && (f as any).directUrl !== f.link) {
          output += `- Link Directo Ficha: ${(f as any).directUrl}\n`;
        }
      }

      if (includeObservations && f.observations) {
        let obsText = f.observations.trim();
        if (autoCompact && obsText.length > 200) {
          obsText = obsText.substring(0, 200) + '... [Texto recortado por auto-compactación]';
        }
        output += `- Observaciones Técnicas: ${obsText}\n`;
      }

      const tasksList = f.tasks || (f as any).checklist;
      if (includeChecklist && tasksList && tasksList.length > 0) {
        output += `- Checklist de Seguimiento (${tasksList.length} ítems):\n`;
        tasksList.forEach((item: any) => {
          const mark = item.completed ? '[x]' : '[ ]';
          output += `   ${mark} ${item.title || item.text}\n`;
        });
      }

      if (includeEditions && (f as any).previousEditionName) {
        output += `- Edición Previa Vinculada: ${(f as any).previousEditionName} (ID: ${f.previousEditionId || 'N/A'})\n`;
      }

      if (includeStatusHistory && f.statusHistory && f.statusHistory.length > 0) {
        output += `- Historial de Cambios (${f.statusHistory.length}):\n`;
        const historySlice = autoCompact ? f.statusHistory.slice(-3) : f.statusHistory;
        historySlice.forEach(h => {
          const ts = h.timestamp ? formatDate(h.timestamp) : 'N/A';
          output += `   • [${ts}] ${(h as any).fromStatus || 'ESTADO'} ➔ ${h.status || (h as any).toStatus} ${h.note ? `("${h.note}")` : ''}\n`;
        });
      }

      output += `\n--------------------------------------------------------------------------------\n\n`;
    });

    return output;
  }, [
    filteredFestivals, timeRange, customDays, customDateFrom, customDateTo, userName,
    promptPreset, includeObservations, includeChecklist, includeStatusHistory,
    includeLinks, includeEditions, autoCompact
  ]);

  // Real-time character & token estimation
  const charCount = summaryText.length;
  const tokenEstimate = Math.round(charCount / 4); // ~4 chars per token rule of thumb

  // Token threshold indicator
  const isHighToken = tokenEstimate > 30000;
  const isMediumToken = tokenEstimate >= 15000 && tokenEstimate <= 30000;

  // Actions
  const handleCopyText = () => {
    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      if (showToast) showToast("¡Resumen para Prompts copiado al portapapeles! 📋");
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {
      if (showToast) showToast("Error al copiar texto.");
    });
  };

  const handleDownloadFile = (ext: 'md' | 'txt') => {
    const filename = `Festis_Resumen_Prompts_${format(new Date(), 'yyyyMMdd_HHmm')}.${ext}`;
    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (showToast) showToast(`Archivo .${ext} descargado correctamente. 💾`);
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;
      const maxLineWidth = pageWidth - margin * 2;

      doc.setFont('courier', 'normal');
      doc.setFontSize(8);

      const lines = doc.splitTextToSize(summaryText, maxLineWidth);
      let y = 15;
      const lineHeight = 4;

      lines.forEach((line: string) => {
        if (y + lineHeight > pageHeight - 15) {
          doc.addPage();
          y = 15;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      doc.save(`Festis_Resumen_Prompts_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
      if (showToast) showToast("Documento PDF descargado. 📄");
    } catch (e: any) {
      alert("Error al generar PDF: " + e.message);
    }
  };

  return (
    <div className="col-span-1 md:col-span-2 glass-card p-5 sm:p-6 hover:shadow-xl transition-all border-t-4 border-t-pink-500 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Interactive Dropdown Header */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#e91e63] flex items-center justify-center shadow-inner shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 group-hover:text-pink-600 transition-colors">
                Resumen de Festivales para Prompts de IA
              </h3>
              <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-200">
                Optimizado para LLMs
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Genera texto estructurado en Markdown, TXT o PDF optimizado para pegar en ChatGPT, Gemini o Claude.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Real-time Token Counter Badge */}
          <div className={cn(
            "px-3 py-1.5 rounded-2xl border text-right shrink-0 flex items-center gap-2.5 transition-colors",
            isHighToken 
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : isMediumToken
              ? "bg-sky-50 border-sky-300 text-sky-900"
              : "bg-emerald-50 border-emerald-300 text-emerald-900"
          )}>
            <div>
              <div className="text-[9px] font-black uppercase tracking-wider opacity-80">
                Estimación IA
              </div>
              <div className="text-[11px] font-mono font-bold flex items-center gap-1">
                <span>{charCount.toLocaleString()} chars</span>
                <span>•</span>
                <span className="underline decoration-2">~{tokenEstimate.toLocaleString()} tokens</span>
              </div>
            </div>
            <div className={cn(
              "w-2.5 h-2.5 rounded-full animate-ping",
              isHighToken ? "bg-amber-500" : isMediumToken ? "bg-sky-500" : "bg-emerald-500"
            )} />
          </div>

          {/* Toggle Button Icon */}
          <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-pink-100 text-slate-600 group-hover:text-pink-700 transition-all border border-slate-200">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {/* Expandable Body Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="prompt-summary-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-6 pt-6 border-t border-slate-100 mt-4 overflow-hidden"
          >
            {/* Control Grid: Rango de Días & Preset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Time Range Selector */}
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-pink-600" /> Rango de Análisis Temporal
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'hoy', label: 'Hoy (1d)' },
              { id: 'semana', label: 'Semanal (7d)' }, // Default
              { id: 'mes', label: 'Mensual (30d)' },
              { id: '60dias', label: '60 Días' },
              { id: '90dias', label: '90 Días' },
              { id: 'todos', label: 'Todos los registros' },
              { id: 'personalizado', label: 'Personalizado' },
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setTimeRange(r.id as TimeRangeType)}
                className={cn(
                  "px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer border",
                  timeRange === r.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {timeRange === 'personalizado' && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-slate-200"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Fecha Desde</label>
                <input 
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Fecha Hasta</label>
                <input 
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Prompt Preset Selector */}
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sliders className="h-4 w-4 text-pink-600" /> Plantilla de Prompt Instruccional
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'limpio', name: 'Texto Puro (Markdown)', desc: 'Sin instrucciones de IA' },
              { id: 'analisis', name: 'Estrategia y Vencimientos', desc: 'Asesor de distribución' },
              { id: 'resumen_ejecutivo', name: 'Resumen Ejecutivo', desc: 'Visión general alta gerencia' },
              { id: 'pendientes', name: 'Plan de Tareas Pendientes', desc: 'Foco en checklists por cerrar' },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPromptPreset(p.id as PromptPresetType)}
                className={cn(
                  "p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between",
                  promptPreset === p.id
                    ? "bg-pink-50/90 border-pink-400 text-pink-950 font-bold"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                )}
              >
                <span className="text-[10px] uppercase font-black tracking-wider leading-tight">{p.name}</span>
                <span className="text-[9px] text-slate-500 font-medium leading-none mt-1">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Customization Checkboxes & Status Filter */}
      <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-pink-600" /> Campos Incluidos en el Resumen
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllStatuses}
              className="text-[10px] font-bold text-pink-700 hover:underline cursor-pointer"
            >
              Todos los estados
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={handleSelectPendingStatuses}
              className="text-[10px] font-bold text-pink-700 hover:underline cursor-pointer"
            >
              Solo Pendientes
            </button>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-semibold text-slate-700">
          <label className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-100">
            <input 
              type="checkbox" 
              checked={includeObservations} 
              onChange={e => setIncludeObservations(e.target.checked)} 
              className="rounded accent-pink-600 h-3.5 w-3.5"
            />
            <span className="text-[11px]">Observaciones técnicas</span>
          </label>
          <label className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-100">
            <input 
              type="checkbox" 
              checked={includeChecklist} 
              onChange={e => setIncludeChecklist(e.target.checked)} 
              className="rounded accent-pink-600 h-3.5 w-3.5"
            />
            <span className="text-[11px]">Checklist de seguimiento</span>
          </label>
          <label className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-100">
            <input 
              type="checkbox" 
              checked={includeLinks} 
              onChange={e => setIncludeLinks(e.target.checked)} 
              className="rounded accent-pink-600 h-3.5 w-3.5"
            />
            <span className="text-[11px]">Enlaces web e inscripción</span>
          </label>
          <label className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-100">
            <input 
              type="checkbox" 
              checked={includeEditions} 
              onChange={e => setIncludeEditions(e.target.checked)} 
              className="rounded accent-pink-600 h-3.5 w-3.5"
            />
            <span className="text-[11px]">Ediciones previas vinculadas</span>
          </label>
          <label className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-100">
            <input 
              type="checkbox" 
              checked={includeStatusHistory} 
              onChange={e => setIncludeStatusHistory(e.target.checked)} 
              className="rounded accent-pink-600 h-3.5 w-3.5"
            />
            <span className="text-[11px]">Historial de estados</span>
          </label>
          <label className={cn(
            "flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all",
            autoCompact ? "bg-amber-100 border-amber-300 text-amber-950 font-bold" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
          )}>
            <input 
              type="checkbox" 
              checked={autoCompact} 
              onChange={e => setAutoCompact(e.target.checked)} 
              className="rounded accent-amber-600 h-3.5 w-3.5"
            />
            <span className="text-[11px] flex items-center gap-1">
              ⚡ Auto-Compactar
            </span>
          </label>
        </div>

        {/* Status Pills */}
        <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-1.5">
          {Object.values(FestivalStatus).map(st => {
            const isSel = selectedStatuses.includes(st);
            return (
              <button
                key={st}
                type="button"
                onClick={() => toggleStatus(st)}
                className={cn(
                  "px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full transition-all cursor-pointer border",
                  isSel
                    ? "bg-pink-600 text-white border-pink-600 shadow-2xs"
                    : "bg-slate-200/60 text-slate-600 border-slate-300/80 hover:bg-slate-300/60"
                )}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* High Token Warning Banner */}
      {isHighToken && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-black uppercase tracking-wide">
                Resumen Extenso (~{tokenEstimate.toLocaleString()} tokens)
              </p>
              <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium">
                Este reporte contiene un volumen elevado de datos. Si vas a utilizar modelos de IA estándar, se recomienda activar <strong>Auto-Compactar</strong> o acortar el rango de días para evitar truncamientos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoCompact(true)}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Activar Auto-Compactar
          </button>
        </div>
      )}

      {/* Live Text Preview Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Code className="h-4 w-4 text-pink-600" /> Vista Previa del Texto ({filteredFestivals.length} festivales)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {charCount.toLocaleString()} caracteres
          </span>
        </div>
        <textarea
          readOnly
          value={summaryText}
          rows={7}
          className="w-full bg-slate-900 text-emerald-400 font-mono text-[11px] p-4 rounded-2xl border border-slate-800 focus:outline-none custom-scrollbar leading-relaxed"
        />
      </div>

      {/* Action Buttons: Copiar y Descargas */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleCopyText}
          className={cn(
            "w-full sm:w-auto px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer",
            copied
              ? "bg-emerald-600 text-white shadow-emerald-600/30"
              : "bg-[#e91e63] hover:bg-[#d81b60] text-white shadow-[#e91e63]/25 active:scale-98"
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "¡Copiado al Portapapeles!" : "Copiar Resumen para IA"}
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => handleDownloadFile('md')}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-purple-600" /> Descargar .MD
          </button>
          <button
            type="button"
            onClick={() => handleDownloadFile('txt')}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileDown className="h-3.5 w-3.5 text-slate-600" /> Descargar .TXT
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileDown className="h-3.5 w-3.5 text-red-600" /> Descargar PDF
          </button>
        </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper Functions
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = parseISO(dateStr);
    if (isValid(d)) {
      return format(d, 'dd/MM/yyyy');
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
}

function getTimeRangeLabel(
  range: TimeRangeType, 
  customDays: number, 
  from: string, 
  to: string
): string {
  switch (range) {
    case 'hoy': return 'Último Día (Hoy)';
    case 'semana': return 'Últimos 7 Días (Semanal)';
    case 'mes': return 'Últimos 30 Días (Mensual)';
    case '60dias': return 'Últimos 60 Días';
    case '90dias': return 'Últimos 90 Días';
    case 'todos': return 'Histórico Completo (Sin filtro de fecha)';
    case 'personalizado':
      if (from && to) return `Personalizado (${from} a ${to})`;
      return `Personalizado (${customDays} días)`;
    default: return 'Semanal';
  }
}

function differenceInCalendarDays(d1: Date, d2: Date): number {
  const diffTime = Math.abs(d1.getTime() - d2.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function isSameDayOrFuture(target: Date, todayStart: Date): boolean {
  return target.getTime() >= todayStart.getTime();
}
