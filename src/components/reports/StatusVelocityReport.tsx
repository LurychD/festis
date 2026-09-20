import React, { useMemo, useState } from "react";
import { Festival, FestivalStatus, AuditLog, StatusHistoryEntry } from "../../types";
import { format, differenceInDays, parseISO, isValid } from "date-fns";
import { 
  Clock, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  History, 
  User, 
  Calendar,
  Filter,
  BarChart2,
  Sparkles
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { cn, getStatusColorStyles } from "../../utils/helpers";

interface StatusVelocityReportProps {
  festivals: Festival[];
  auditLogs?: AuditLog[];
}

interface ProcessedTransition {
  id: string;
  festivalId?: string;
  festivalName: string;
  previousStatus?: FestivalStatus | string;
  newStatus: FestivalStatus | string;
  timestamp: string;
  updatedBy?: string;
  note?: string;
  daysInPreviousStatus?: number;
}

export const StatusVelocityReport: React.FC<StatusVelocityReportProps> = ({
  festivals,
  auditLogs = [],
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // 1. Extraer y procesar todas las transiciones (Trazabilidad)
  const transitionsData = useMemo(() => {
    const list: ProcessedTransition[] = [];

    // Recoger entradas de statusHistory de cada festival
    festivals.forEach((f) => {
      if (f.statusHistory && f.statusHistory.length > 0) {
        // Ordenar statusHistory cronológicamente
        const sortedHistory = [...f.statusHistory].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        sortedHistory.forEach((sh, index) => {
          let daysSpent: number | undefined = undefined;
          if (index > 0) {
            const prevTime = new Date(sortedHistory[index - 1].timestamp).getTime();
            const currTime = new Date(sh.timestamp).getTime();
            const diffInMs = currTime - prevTime;
            daysSpent = Math.max(0, Math.round(diffInMs / (1000 * 60 * 60 * 24)));
          }

          list.push({
            id: sh.id || `hist-${f.id}-${index}`,
            festivalId: f.id,
            festivalName: f.name,
            previousStatus: sh.previousStatus,
            newStatus: sh.status,
            timestamp: sh.timestamp,
            updatedBy: sh.updatedBy || "Sistema",
            note: sh.note,
            daysInPreviousStatus: daysSpent
          });
        });
      }
    });

    // Complementar con auditLogs para soporte con el sistema antiguo
    if (auditLogs && auditLogs.length > 0) {
      auditLogs.forEach((log) => {
        if (!log.details) return;

        const quickMatch = log.details.match(/ha cambiado el estado de '(.*?)' a ([^.]*)/);
        if (quickMatch) {
          const festName = quickMatch[1].trim();
          const newStatus = quickMatch[2].trim();

          // Evitar duplicados si ya está en statusHistory
          const exists = list.some(
            (t) => t.festivalName.toLowerCase() === festName.toLowerCase() &&
              t.newStatus === newStatus &&
              Math.abs(new Date(t.timestamp).getTime() - new Date(log.timestamp).getTime()) < 60000
          );

          if (!exists) {
            list.push({
              id: log.id || `audit-${Math.random()}`,
              festivalName: festName,
              newStatus: newStatus,
              timestamp: log.timestamp,
              updatedBy: log.user || "Usuario",
              note: "Registrado vía auditoría histórica"
            });
          }
        }
      });
    }

    // Ordenar de más reciente a más antiguo
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [festivals, auditLogs]);

  // 2. Trazabilidad de permanencia promedio por estado
  const averageDaysPerStatus = useMemo(() => {
    const statusDurations: Record<string, number[]> = {};

    festivals.forEach((f) => {
      if (f.statusHistory && f.statusHistory.length > 1) {
        const sorted = [...f.statusHistory].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        for (let i = 0; i < sorted.length - 1; i++) {
          const curr = sorted[i];
          const next = sorted[i + 1];
          const days = Math.round(
            (new Date(next.timestamp).getTime() - new Date(curr.timestamp).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (days >= 0 && days < 365) {
            if (!statusDurations[curr.status]) statusDurations[curr.status] = [];
            statusDurations[curr.status].push(days);
          }
        }
      }
    });

    const result = Object.entries(statusDurations).map(([status, durations]) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      return {
        status,
        avgDays: Math.round(avg * 10) / 10,
        sampleCount: durations.length
      };
    });

    return result.sort((a, b) => b.avgDays - a.avgDays);
  }, [festivals]);

  // 3. Tendencia mensual de transiciones
  const monthlyTransitionsData = useMemo(() => {
    const monthsMap: Record<string, number> = {};

    transitionsData.forEach((t) => {
      if (!t.timestamp) return;
      const date = parseISO(t.timestamp);
      if (isValid(date)) {
        const monthKey = format(date, "MMM yyyy");
        monthsMap[monthKey] = (monthsMap[monthKey] || 0) + 1;
      }
    });

    return Object.entries(monthsMap)
      .map(([month, count]) => ({ month, Cambios: count }))
      .reverse();
  }, [transitionsData]);

  // Transiciones filtradas para la tabla
  const filteredTransitions = useMemo(() => {
    return transitionsData.filter((t) => {
      const matchesFilter =
        selectedStatusFilter === "all" ||
        t.newStatus === selectedStatusFilter ||
        t.previousStatus === selectedStatusFilter;
      const matchesSearch =
        !searchTerm ||
        t.festivalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.updatedBy && t.updatedBy.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [transitionsData, selectedStatusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header explicativo */}
      <div className="glass-card p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-3 border border-indigo-500/30">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Nuevo Sistema Aislado de Trazabilidad
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Informe de Velocidad & Transiciones de Estado
            </h3>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl leading-relaxed">
              Mide la frecuencia de cambio de estados, el tiempo promedio de permanencia en cada etapa y el historial detallado con la tecnología de trazabilidad por registros históricos.
            </p>
          </div>

          <div className="flex gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] uppercase font-black text-indigo-300 block">Total Cambios</span>
              <span className="text-2xl font-black text-white">{transitionsData.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] uppercase font-black text-indigo-300 block">Con Historial</span>
              <span className="text-2xl font-black text-emerald-400">
                {festivals.filter(f => f.statusHistory && f.statusHistory.length > 0).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permanencia Promedio por Estado */}
        <div className="glass-card p-6 rounded-[2rem] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                Permanencia Promedio (Días por Estado)
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">
                Días promedio que permanece un festival en cada etapa antes de pasar a otra.
              </p>
            </div>
          </div>

          {averageDaysPerStatus.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-400 italic">
              Se requieren múltiples cambios de estado registrados para calcular tiempos promedio de permanencia.
            </div>
          ) : (
            <div className="space-y-3">
              {averageDaysPerStatus.map((item, idx) => {
                const styles = getStatusColorStyles(item.status as FestivalStatus);
                return (
                  <div key={`svr-avg-${item.status}-${idx}`} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider", styles)}>
                        {item.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        ({item.sampleCount} transiciones)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-800">
                        ~{item.avgDays}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">días</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gráfico de Evolución Mensual de Cambios */}
        <div className="glass-card p-6 rounded-[2rem] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-indigo-500" />
                Volumen Mensual de Movimientos
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">
                Cantidad de cambios de estado registrados por mes.
              </p>
            </div>
          </div>

          {monthlyTransitionsData.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-400 italic">
              No hay suficientes datos mensuales.
            </div>
          ) : (
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTransitionsData}>
                  <defs>
                    <linearGradient id="colorTransitions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "1rem", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px" }} 
                  />
                  <Area type="monotone" dataKey="Cambios" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTransitions)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Tabla Registros de Trazabilidad */}
      <div className="glass-card p-6 rounded-[2rem] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-500" />
              Bitácora Completa de Trazabilidad
            </h4>
            <p className="text-[10px] text-slate-400 font-medium">
              Listado en tiempo real de todas las transiciones registradas por el nuevo sistema.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Buscar festival o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none"
            >
              <option value="all">Todos los estados</option>
              {Object.values(FestivalStatus).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredTransitions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-400 italic">
            No se encontraron registros que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Festival</th>
                  <th className="py-3 px-3">Estado Anterior</th>
                  <th className="py-3 px-3">Nuevo Estado</th>
                  <th className="py-3 px-3">Permanencia</th>
                  <th className="py-3 px-3">Modificado por</th>
                  <th className="py-3 px-3">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransitions.slice(0, 30).map((item, idx) => {
                  const newStyles = getStatusColorStyles(item.newStatus as FestivalStatus);
                  const prevStyles = item.previousStatus ? getStatusColorStyles(item.previousStatus as FestivalStatus) : null;
                  const formattedDate = item.timestamp
                    ? format(parseISO(item.timestamp), "dd/MM/yyyy HH:mm")
                    : "-";

                  return (
                    <tr key={`svr-tr-${item.id || 'tr'}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {item.festivalName}
                      </td>
                      <td className="py-3 px-3">
                        {item.previousStatus && prevStyles ? (
                          <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase", prevStyles)}>
                            {item.previousStatus}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic text-[10px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider", newStyles)}>
                          {item.newStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-600">
                        {item.daysInPreviousStatus !== undefined ? (
                          <span>{item.daysInPreviousStatus} días</span>
                        ) : (
                          <span className="text-slate-300 italic">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-600">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" />
                          {item.updatedBy || "Sistema"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-medium">
                        {formattedDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredTransitions.length > 30 && (
              <p className="text-[10px] text-center text-slate-400 italic pt-3">
                Mostrando las 30 transiciones más recientes de {filteredTransitions.length} encontradas.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
