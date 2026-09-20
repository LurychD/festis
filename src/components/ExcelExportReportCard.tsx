import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, FileDown, Calendar, Filter, CheckSquare, 
  ChevronDown, ChevronUp, Layers, Check, Download, Table
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { subDays, parseISO, isValid, isAfter, isBefore, startOfDay, endOfDay, format, isSameDay } from 'date-fns';
import { Festival, FestivalStatus } from '../types';
import { cn } from '../utils/helpers';

interface ExcelExportReportCardProps {
  festivals: Festival[];
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type TimeRangeType = 'hoy' | 'semana' | 'mes' | '60dias' | '90dias' | 'todos' | 'personalizado';
type ExportFormatType = 'xlsx' | 'csv';

// Helper functions for safe date parsing and formatting
function safeParseDate(dateVal: any): Date | null {
  if (!dateVal) return null;
  try {
    if (typeof dateVal === 'string' && dateVal.trim() !== '') {
      let d = parseISO(dateVal);
      if (isValid(d)) return d;
      d = new Date(dateVal);
      if (isValid(d)) return d;
    } else if (typeof dateVal === 'number') {
      const d = new Date(dateVal);
      if (isValid(d)) return d;
    } else if (dateVal instanceof Date) {
      if (isValid(dateVal)) return dateVal;
    } else if (typeof dateVal === 'object' && dateVal !== null && 'seconds' in dateVal) {
      const d = new Date((dateVal as any).seconds * 1000);
      if (isValid(d)) return d;
    }
  } catch {
    // catch any unexpected error
  }
  return null;
}

function safeFormatDate(dateVal: any, formatStr: string = 'dd/MM/yyyy'): string {
  if (!dateVal) return '-';
  const d = safeParseDate(dateVal);
  if (d) {
    try {
      return format(d, formatStr);
    } catch {
      // fallback
    }
  }
  return typeof dateVal === 'string' ? dateVal : '-';
}

export const ExcelExportReportCard: React.FC<ExcelExportReportCardProps> = ({
  festivals,
  showToast
}) => {
  // Collapsible Accordion State (Collapsed by default for neatness)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Export Settings State
  const [exportFormat, setExportFormat] = useState<ExportFormatType>('xlsx');
  const [includeSummarySheet, setIncludeSummarySheet] = useState<boolean>(true);

  // Time Range & Filter States
  const [timeRange, setTimeRange] = useState<TimeRangeType>('todos');
  const [customDays, setCustomDays] = useState<number>(30);
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');

  // Selected Statuses Filter
  const ALL_STATUSES = Object.values(FestivalStatus);
  const [selectedStatuses, setSelectedStatuses] = useState<FestivalStatus[]>(ALL_STATUSES);

  // Custom Columns Selection
  const [includedColumns, setIncludedColumns] = useState<{
    basic: boolean;
    dates: boolean;
    financial: boolean;
    details: boolean;
    tasks: boolean;
    history: boolean;
  }>({
    basic: true,
    dates: true,
    financial: true,
    details: true,
    tasks: true,
    history: false,
  });

  // Toggle Status Selection
  const toggleStatus = (st: FestivalStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(st) 
        ? prev.filter(item => item !== st)
        : [...prev, st]
    );
  };

  const selectAllStatuses = () => setSelectedStatuses(ALL_STATUSES);
  const clearStatuses = () => setSelectedStatuses([]);

  // Helper date comparisons
  const isSameDayOrFuture = (d1: Date, d2: Date) => {
    return isAfter(d1, d2) || isSameDay(d1, d2);
  };

  // Filtered Festivals Memo
  const filteredFestivals = useMemo(() => {
    const todayStart = startOfDay(new Date());

    return festivals.filter(f => {
      // 1. Status Filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(f.status)) {
        return false;
      }

      // 2. Time Range Filter based on deadline, newsDate, updatedAt or createdAt
      const relevantDateStr = f.deadline || f.newsDate || f.updatedAt || f.createdAt;
      if (!relevantDateStr) return timeRange === 'todos';

      const parsedDate = safeParseDate(relevantDateStr);
      if (!parsedDate) return timeRange === 'todos';

      if (timeRange === 'todos') return true;

      if (timeRange === 'hoy') {
        const diffInDays = Math.abs(differenceInDaysHelper(todayStart, startOfDay(parsedDate)));
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
          const from = safeParseDate(customDateFrom);
          const to = safeParseDate(customDateTo);
          if (from && to) {
            const startFrom = startOfDay(from);
            const endTo = endOfDay(to);
            return (isAfter(parsedDate, startFrom) || parsedDate.getTime() === startFrom.getTime()) &&
                   (isBefore(parsedDate, endTo) || parsedDate.getTime() === endTo.getTime());
          }
        } else if (customDays > 0) {
          const cutoff = subDays(todayStart, customDays);
          return isAfter(parsedDate, cutoff) || isSameDayOrFuture(parsedDate, todayStart);
        }
      }

      return true;
    });
  }, [festivals, selectedStatuses, timeRange, customDays, customDateFrom, customDateTo]);

  function differenceInDaysHelper(d1: Date, d2: Date) {
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Label Helper
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'hoy': return 'Hoy';
      case 'semana': return 'Última semana (7 días)';
      case 'mes': return 'Último mes (30 días)';
      case '60dias': return 'Últimos 60 días';
      case '90dias': return 'Últimos 90 días';
      case 'todos': return 'Todo el historial registrado';
      case 'personalizado': 
        if (customDateFrom && customDateTo) {
          return `${customDateFrom} a ${customDateTo}`;
        }
        return `Últimos ${customDays} días`;
      default: return 'Filtro seleccionado';
    }
  };

  // Generate & Download Excel / CSV File
  const handleExport = () => {
    if (filteredFestivals.length === 0) {
      showToast?.('No hay festivales seleccionados para exportar.', 'error');
      return;
    }

    try {
      // 1. Map row objects based on user column preferences
      const rows = filteredFestivals.map((f, idx) => {
        const row: Record<string, any> = {};

        row['#'] = idx + 1;

        if (includedColumns.basic) {
          row['Nombre del Festival'] = f.name || '';
          row['País'] = f.country || '';
          row['Tipo / Formato'] = f.type || '';
          row['Estado'] = f.status || '';
          row['Categoría / Sección'] = f.category || '';
        }

        if (includedColumns.dates) {
          row['Fecha Cierre (Deadline)'] = safeFormatDate(f.deadline, 'dd/MM/yyyy');
          row['Fecha Noticias / Notificación'] = safeFormatDate(f.newsDate, 'dd/MM/yyyy');
          row['Fecha Proyección'] = safeFormatDate(f.projectionDate, 'dd/MM/yyyy');
          row['Lugar Proyección'] = f.projectionLocation || '-';
        }

        if (includedColumns.financial) {
          row['Plataforma'] = f.platform || '-';
          row['Tarifa / Fee ($)'] = f.fee ?? '-';
          row['Costo Texto'] = f.price || '-';
        }

        if (includedColumns.details) {
          row['Enlace / Sitio Web'] = f.link || (f as any).website || (f as any).directUrl || '-';
          row['Año Edición'] = f.editionYear || '-';
          row['Número Edición'] = f.editionNumber ? `Ed. #${f.editionNumber}` : '-';
          row['Laurel / Reconocimiento'] = f.laurel || '-';
          row['Observaciones'] = f.observations || '-';
        }

        if (includedColumns.tasks) {
          const completed = f.tasks?.filter(t => t.completed).length || 0;
          const total = f.tasks?.length || 0;
          row['Tareas Completadas'] = `${completed}/${total}`;
          row['Progreso Checklist %'] = total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%';
        }

        if (includedColumns.history) {
          row['Cambios de Estado'] = f.statusHistory?.length || 0;
          row['Fecha de Creación'] = safeFormatDate(f.createdAt, 'dd/MM/yyyy HH:mm');
          row['Última Actualización'] = safeFormatDate(f.updatedAt, 'dd/MM/yyyy HH:mm');
        }

        return row;
      });

      // 2. Create Sheet from JSON
      const mainSheet = XLSX.utils.json_to_sheet(rows);

      // Auto-size columns for pristine spreadsheet presentation
      if (rows.length > 0) {
        const colKeys = Object.keys(rows[0]);
        const colWidths = colKeys.map(key => {
          let maxLen = key.length;
          rows.forEach(r => {
            const valStr = String(r[key] || '');
            if (valStr.length > maxLen) maxLen = Math.min(valStr.length, 50); // cap width at 50
          });
          return { wch: maxLen + 3 };
        });
        mainSheet['!cols'] = colWidths;
      }

      // 3. Create Workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, mainSheet, 'Festivales');

      // 4. Optionally append Summary KPI sheet (if XLSX format and toggle active)
      if (exportFormat === 'xlsx' && includeSummarySheet) {
        const statusCounts: Record<string, number> = {};
        filteredFestivals.forEach(f => {
          statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
        });

        const summaryRows: any[] = [
          { 'Métrica / Parámetro': 'Título de Reporte', 'Detalle': 'Exportación Consolidada de Festivales - Festis' },
          { 'Métrica / Parámetro': 'Fecha de Generación', 'Detalle': format(new Date(), 'dd/MM/yyyy HH:mm') },
          { 'Métrica / Parámetro': 'Filtro Temporal Aplicado', 'Detalle': getTimeRangeLabel() },
          { 'Métrica / Parámetro': 'Total Registros Exportados', 'Detalle': filteredFestivals.length },
          { 'Métrica / Parámetro': '---', 'Detalle': '---' }
        ];

        Object.entries(statusCounts).forEach(([st, cnt]) => {
          summaryRows.push({
            'Métrica / Parámetro': `Estado: ${st}`,
            'Detalle': `${cnt} festival(es)`
          });
        });

        const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
        summarySheet['!cols'] = [{ wch: 35 }, { wch: 45 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen KPIs');
      }

      // 5. File Download
      const dateStamp = format(new Date(), 'yyyy-MM-dd_HHmm');
      const filename = `Festivales_${dateStamp}.${exportFormat}`;

      if (exportFormat === 'csv') {
        XLSX.writeFile(workbook, filename, { bookType: 'csv' });
      } else {
        XLSX.writeFile(workbook, filename, { bookType: 'xlsx' });
      }

      showToast?.(`Reporte exportado con éxito (${filteredFestivals.length} registros).`, 'success');
    } catch (err) {
      console.error('Error al exportar Excel:', err);
      showToast?.('Ocurrió un error al generar la hoja de cálculo.', 'error');
    }
  };

  return (
    <div className="col-span-1 md:col-span-2 glass-card p-5 sm:p-6 hover:shadow-xl transition-all border-t-4 border-t-emerald-600 relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Accordion Header */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner shrink-0 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 group-hover:text-emerald-700 transition-colors">
                Exportar Informe a Excel (.xlsx / .csv)
              </h3>
              <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Data Tabular
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Genera planillas Microsoft Excel estructuradas con hojas de resumen, formatos numéricos y listas filtrables.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Badge counter */}
          <div className="px-3 py-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 text-right shrink-0 flex items-center gap-2">
            <Table className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-mono font-bold">
              {filteredFestivals.length} registro(s)
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-700 transition-all border border-slate-200">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {/* Expandable Accordion Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="excel-export-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-6 pt-6 border-t border-slate-100 mt-4 overflow-hidden"
          >
            {/* Control Grid: Formato y Filtros Temporales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Formato de Archivo & Opciones */}
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileDown className="h-4 w-4 text-emerald-600" />
                  Formato de Salida
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat('xlsx')}
                    className={cn(
                      "py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border",
                      exportFormat === 'xlsx'
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={cn(
                      "py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border",
                      exportFormat === 'csv'
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    <Table className="h-4 w-4" />
                    Texto (.csv)
                  </button>
                </div>

                {exportFormat === 'xlsx' && (
                  <label className="flex items-center gap-2 pt-1 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSummarySheet}
                      onChange={e => setIncludeSummarySheet(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Incluir pestaña adicional "Resumen KPIs" en el libro</span>
                  </label>
                )}
              </div>

              {/* Rango de Tiempo */}
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  Rango de Fechas
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRangeType)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="todos">Todo el historial registrado</option>
                  <option value="semana">Última semana (7 días)</option>
                  <option value="mes">Último mes (30 días)</option>
                  <option value="60dias">Últimos 60 días</option>
                  <option value="90dias">Últimos 90 días</option>
                  <option value="hoy">Únicamente hoy</option>
                  <option value="personalizado">Rango Personalizado</option>
                </select>

                {timeRange === 'personalizado' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Desde</label>
                      <input
                        type="date"
                        value={customDateFrom}
                        onChange={e => setCustomDateFrom(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Hasta</label>
                      <input
                        type="date"
                        value={customDateTo}
                        onChange={e => setCustomDateTo(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Filter Multi-Select */}
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-emerald-600" />
                  Filtrar por Estados ({selectedStatuses.length} de {ALL_STATUSES.length})
                </label>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <button 
                    type="button" 
                    onClick={selectAllStatuses}
                    className="text-emerald-700 hover:underline cursor-pointer"
                  >
                    Seleccionar Todos
                  </button>
                  <span className="text-slate-300">•</span>
                  <button 
                    type="button" 
                    onClick={clearStatuses}
                    className="text-slate-500 hover:underline cursor-pointer"
                  >
                    Deseleccionar
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {ALL_STATUSES.map(st => {
                  const isSelected = selectedStatuses.includes(st);
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => toggleStatus(st)}
                      className={cn(
                        "px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold uppercase tracking-wide transition-all cursor-pointer border flex items-center gap-1",
                        isSelected
                          ? "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-sm"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100 opacity-60"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-emerald-700" />}
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Columns Customization Toggles */}
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-emerald-600" />
                Columnas a Incluir en la Planilla
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={includedColumns.basic}
                    onChange={e => setIncludedColumns(p => ({ ...p, basic: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Datos Principales</span>
                </label>

                <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={includedColumns.dates}
                    onChange={e => setIncludedColumns(p => ({ ...p, dates: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Fechas Clave</span>
                </label>

                <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={includedColumns.financial}
                    onChange={e => setIncludedColumns(p => ({ ...p, financial: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Plataforma y Tarifas</span>
                </label>

                <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={includedColumns.details}
                    onChange={e => setIncludedColumns(p => ({ ...p, details: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Enlaces y Edición</span>
                </label>

                <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={includedColumns.tasks}
                    onChange={e => setIncludedColumns(p => ({ ...p, tasks: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Métricas de Checklist</span>
                </label>

                <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={includedColumns.history}
                    onChange={e => setIncludedColumns(p => ({ ...p, history: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Historial y Auditoría</span>
                </label>
              </div>
            </div>

            {/* Action Export Button */}
            <button
              onClick={handleExport}
              disabled={filteredFestivals.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Descargar Planilla Excel ({filteredFestivals.length} festivales)
            </button>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
