import React, { useState, useMemo } from "react";
import { 
  format,
  differenceInDays, 
  parseISO, 
  isValid, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  startOfMonth, 
  subDays, 
  subMonths, 
  isWithinInterval 
} from "date-fns";
import {
  FileDown,
  MapPin,
  ExternalLink,
  Key,
  Search,
  ChevronRight,
  Globe,
  BarChart3,
  Projector,
  Activity,
  Calendar as CalendarIcon,
  Map as MapIcon,
  Layers,
  ArrowRight,
  History,
  User,
  Clock,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Filter,
  DollarSign,
  TrendingUp,
  PieChart as PieChartIcon,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  Info,
  Percent,
  X
} from "lucide-react";
import { StatusVelocityReport } from "./reports/StatusVelocityReport";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area,
  Treemap,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Festival, FestivalStatus, AuditLog } from "../types";
import {
  MapContainer,
  TileLayer,
  Marker as LeafletMarker,
  Popup as LeafletPopup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

function MapUpdater() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [map]);
  return null;
}

const createMarkerIcon = (color: string) => {
  return L.divIcon({
    className: "custom-div-icon bg-transparent border-0",
    html: `<svg width="28" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
             <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z" fill="${color}"/>
             <circle cx="12" cy="8" r="3" fill="white"/>
           </svg>`,
    iconSize: [28, 34],
    iconAnchor: [14, 34],
    popupAnchor: [0, -34],
  });
};

const createMysteryIcon = () => {
  return L.divIcon({
    className: "custom-div-icon bg-transparent border-0",
    html: `<svg width="28" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
             <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z" fill="#94a3b8"/>
             <text x="12" y="12" font-size="10" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle">?</text>
           </svg>`,
    iconSize: [28, 34],
    iconAnchor: [14, 34],
    popupAnchor: [0, -34],
  });
};

import { cn, formatDisplayDate, parseFestivalDate } from "../utils/helpers";

interface StatsViewProps {
  festivals: Festival[];
  auditLogs?: AuditLog[];
  onExportCSV: () => void;
  onExportPDF: (options?: any) => void;
  onExportProjectionsPDF?: () => void;
  onViewDetails: (festival: Festival) => void;
  setView?: (v: any) => void;
}

const STATUS_COLORS: Record<string, string> = {
  [FestivalStatus.POR_ENVIAR]: "#ef4444",
  [FestivalStatus.PROXIMAMENTE]: "#d946ef",
  [FestivalStatus.EN_REVISION]: "#f97316",
  [FestivalStatus.SELECCIONADO]: "#0ea5e9",
  [FestivalStatus.PROYECTADO]: "#6366f1",
  [FestivalStatus.GANADO]: "#eab308",
  [FestivalStatus.NO_SELECCIONADO]: "#f43f5e",
  [FestivalStatus.EN_DUDA]: "#8b5cf6",
  [FestivalStatus.DESCALIFICADO]: "#64748b",
};

const DYNAMIC_COLORS: Record<string, string> = {
  "Inscripciones": "#3b82f6",
  "Selecciones": "#0ea5e9",
  "Proyecciones": "#6366f1",
  "Premios": "#eab308",
  "Rechazos": "#f43f5e"
};

const COLORS = [
  "#e91e63",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#64748b",
];

const MapMarkerWithInfo: React.FC<{
  festival: Festival;
  onViewDetails: (f: Festival) => void;
  isProjection: boolean;
}> = ({ festival, onViewDetails, isProjection }) => {
  if (!festival.projectionLat || !festival.projectionLng) return null;

  const position: [number, number] = [
    festival.projectionLat,
    festival.projectionLng,
  ];

  const markerColor = isProjection
    ? "#eab308"
    : STATUS_COLORS[festival.status] || "#3b82f6";

  return (
    <LeafletMarker position={position} icon={createMarkerIcon(markerColor)}>
      <LeafletPopup className="custom-popup">
        <div className="p-0 sm:p-1 min-w-[160px] sm:min-w-[200px] max-w-[200px] sm:max-w-none">
          <div className="flex items-center gap-1.5 mb-1">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight flex-1">
              {festival.name}
            </h4>
            <span
              className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white shrink-0"
              style={{ backgroundColor: markerColor }}
            >
              {isProjection ? "Proyección" : festival.status}
            </span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-slate-500 mb-1 flex items-start gap-1 leading-tight">
            <span className="mt-0.5">📍</span>
            <span className="line-clamp-2 min-h-0">
              {festival.projectionLocation || "Sin locación"}
            </span>
          </p>
          <p className="text-[10px] sm:text-xs text-[#e91e63] font-bold mb-1.5 sm:mb-2 flex items-center gap-1">
            <span>📅</span> {festival.projectionDate || "Fecha a confirmar"}
          </p>
          {festival.category && (
            <p className="text-[9px] sm:text-[10px] text-slate-600 mb-0.5 sm:mb-1 leading-tight truncate">
              <span className="font-bold">Categoría:</span> {festival.category}
            </p>
          )}
          {festival.nomination && (
            <p className="text-[9px] sm:text-[10px] text-slate-600 mb-2 sm:mb-3 leading-tight truncate">
              <span className="font-bold">Nominación:</span>{" "}
              {festival.nomination}
            </p>
          )}
          <button
            onClick={() => {
              onViewDetails(festival);
            }}
            className="w-full bg-[#e91e63] text-white text-[9px] sm:text-[10px] uppercase font-black tracking-widest py-1.5 rounded mt-1 hover:bg-pink-700 transition-colors"
          >
            Ver Festival
          </button>
        </div>
      </LeafletPopup>
    </LeafletMarker>
  );
};

export function StatsView({
  festivals: rawFestivals,
  auditLogs = [],
  onExportCSV,
  onExportPDF,
  onExportProjectionsPDF,
  onViewDetails,
  setView,
}: StatsViewProps) {
  const festivals = useMemo(() => {
    return (rawFestivals || []).filter((f) => f.includeInStats !== false);
  }, [rawFestivals]);
  const [activeTab, setActiveTab] = useState<"stats" | "map" | "projections">(
    "stats",
  );
  const [mapVisibleStatuses, setMapVisibleStatuses] = useState<string[]>([
    "PROYECCIONES",
  ]);

  // Date range state for stats filtering (defaulting to current week)
  const [dateFrom, setDateFrom] = useState<string>(() => {
    try {
      const today = new Date();
      const start = startOfWeek(today, { weekStartsOn: 1 });
      return format(start, "yyyy-MM-dd");
    } catch {
      return "";
    }
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    try {
      const today = new Date();
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
      return format(end, "yyyy-MM-dd");
    } catch {
      return "";
    }
  });
  const [engineMode, setEngineMode] = useState<"static" | "dynamic">("static");
  
  // Traceability log filter states
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showIncompleteModal, setShowIncompleteModal] = useState<boolean>(false);
  const [showRoiModal, setShowRoiModal] = useState<boolean>(false);
  const [roiSearchTerm, setRoiSearchTerm] = useState<string>("");
  const [roiFilterFeeOnly, setRoiFilterFeeOnly] = useState<boolean>(false);
  const [bitacoraPage, setBitacoraPage] = useState<number>(1);
  const [bitacoraPageSize, setBitacoraPageSize] = useState<number>(25);

  // Date Formatter: dd-mes-aaaa (e.g., 15-ago-2026)
  const formatCustomDateStr = (dateStr?: string | null): string => {
    if (!dateStr || !dateStr.trim()) return "";
    const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    try {
      const trimmed = dateStr.trim();
      if (trimmed.match(/^\d{4}-\d{2}-\d{2}/)) {
        const parts = trimmed.split('T')[0].split('-');
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parts[2].padStart(2, '0');
        if (monthIdx >= 0 && monthIdx < 12) {
          return `${day}-${months[monthIdx]}-${year}`;
        }
      }
      if (trimmed.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
        const parts = trimmed.split('/');
        const day = parts[0].padStart(2, '0');
        const monthIdx = parseInt(parts[1], 10) - 1;
        const year = parts[2];
        if (monthIdx >= 0 && monthIdx < 12) {
          return `${day}-${months[monthIdx]}-${year}`;
        }
      }
      const parsed = parseISO(trimmed);
      if (isValid(parsed)) {
        const day = String(parsed.getDate()).padStart(2, '0');
        const monthStr = months[parsed.getMonth()];
        const year = parsed.getFullYear();
        return `${day}-${monthStr}-${year}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // Status Theme Helper for Cards & Modal Details
  const getStatusTheme = (st: string, isArchived?: boolean) => {
    if (st === "Archivados" || isArchived) {
      return {
        bg: "bg-slate-100/90",
        border: "border-slate-300 hover:border-slate-400",
        text: "text-slate-900",
        badgeBg: "bg-slate-700 text-white",
        hoverBg: "hover:bg-slate-200/80",
        btnBg: "bg-slate-800 text-white hover:bg-slate-900",
        subText: "text-slate-600",
        accentBorder: "border-l-slate-600"
      };
    }
    switch (st) {
      case FestivalStatus.POR_ENVIAR:
        return {
          bg: "bg-red-50/70",
          border: "border-red-200 hover:border-red-300",
          text: "text-red-950",
          badgeBg: "bg-red-500 text-white",
          hoverBg: "hover:bg-red-100/70",
          btnBg: "bg-red-600 text-white hover:bg-red-700",
          subText: "text-red-700",
          accentBorder: "border-l-red-500"
        };
      case FestivalStatus.PROXIMAMENTE:
        return {
          bg: "bg-fuchsia-50/70",
          border: "border-fuchsia-200 hover:border-fuchsia-300",
          text: "text-fuchsia-950",
          badgeBg: "bg-fuchsia-500 text-white",
          hoverBg: "hover:bg-fuchsia-100/70",
          btnBg: "bg-fuchsia-600 text-white hover:bg-fuchsia-700",
          subText: "text-fuchsia-700",
          accentBorder: "border-l-fuchsia-500"
        };
      case FestivalStatus.EN_REVISION:
        return {
          bg: "bg-orange-50/70",
          border: "border-orange-200 hover:border-orange-300",
          text: "text-orange-950",
          badgeBg: "bg-orange-500 text-white",
          hoverBg: "hover:bg-orange-100/70",
          btnBg: "bg-orange-600 text-white hover:bg-orange-700",
          subText: "text-orange-700",
          accentBorder: "border-l-orange-500"
        };
      case FestivalStatus.EN_DUDA:
        return {
          bg: "bg-violet-50/70",
          border: "border-violet-200 hover:border-violet-300",
          text: "text-violet-950",
          badgeBg: "bg-violet-500 text-white",
          hoverBg: "hover:bg-violet-100/70",
          btnBg: "bg-violet-600 text-white hover:bg-violet-700",
          subText: "text-violet-700",
          accentBorder: "border-l-violet-500"
        };
      case FestivalStatus.SELECCIONADO:
        return {
          bg: "bg-sky-50/70",
          border: "border-sky-200 hover:border-sky-300",
          text: "text-sky-950",
          badgeBg: "bg-sky-500 text-white",
          hoverBg: "hover:bg-sky-100/70",
          btnBg: "bg-sky-600 text-white hover:bg-sky-700",
          subText: "text-sky-700",
          accentBorder: "border-l-sky-500"
        };
      case FestivalStatus.PROYECTADO:
        return {
          bg: "bg-indigo-50/70",
          border: "border-indigo-200 hover:border-indigo-300",
          text: "text-indigo-950",
          badgeBg: "bg-indigo-600 text-white",
          hoverBg: "hover:bg-indigo-100/70",
          btnBg: "bg-indigo-600 text-white hover:bg-indigo-700",
          subText: "text-indigo-700",
          accentBorder: "border-l-indigo-600"
        };
      case FestivalStatus.GANADO:
        return {
          bg: "bg-amber-50/70",
          border: "border-amber-200 hover:border-amber-300",
          text: "text-amber-950",
          badgeBg: "bg-amber-500 text-white",
          hoverBg: "hover:bg-amber-100/70",
          btnBg: "bg-amber-600 text-white hover:bg-amber-700",
          subText: "text-amber-700",
          accentBorder: "border-l-amber-500"
        };
      case FestivalStatus.NO_SELECCIONADO:
        return {
          bg: "bg-rose-50/70",
          border: "border-rose-200 hover:border-rose-300",
          text: "text-rose-950",
          badgeBg: "bg-rose-500 text-white",
          hoverBg: "hover:bg-rose-100/70",
          btnBg: "bg-rose-600 text-white hover:bg-rose-700",
          subText: "text-rose-700",
          accentBorder: "border-l-rose-500"
        };
      case FestivalStatus.DESCALIFICADO:
        return {
          bg: "bg-slate-100/80",
          border: "border-slate-300 hover:border-slate-400",
          text: "text-slate-900",
          badgeBg: "bg-slate-600 text-white",
          hoverBg: "hover:bg-slate-200/80",
          btnBg: "bg-slate-700 text-white hover:bg-slate-800",
          subText: "text-slate-600",
          accentBorder: "border-l-slate-600"
        };
      default:
        return {
          bg: "bg-slate-50",
          border: "border-slate-200 hover:border-slate-300",
          text: "text-slate-800",
          badgeBg: "bg-slate-500 text-white",
          hoverBg: "hover:bg-slate-100",
          btnBg: "bg-slate-600 text-white hover:bg-slate-700",
          subText: "text-slate-500",
          accentBorder: "border-l-slate-400"
        };
    }
  };

  // Temporal status summary state & logic (Default: Semanal)
  const [recentPeriod, setRecentPeriod] = useState<"hoy" | "semanal" | "mensual" | "60dias" | "90dias">("semanal");
  const [selectedRecentStatus, setSelectedRecentStatus] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem("stats_selected_recent_status");
    } catch {
      return null;
    }
  });

  const handleSetSelectedRecentStatus = (status: string | null) => {
    setSelectedRecentStatus(status);
    try {
      if (status) {
        sessionStorage.setItem("stats_selected_recent_status", status);
      } else {
        sessionStorage.removeItem("stats_selected_recent_status");
      }
    } catch {
      // ignore
    }
  };

  const [recentSearchTerm, setRecentSearchTerm] = useState<string>("");

  // Custom renderer for status-specific relevant fields in modal cards
  const renderStatusSpecificDetails = (f: Festival, statusKey: string | null) => {
    const currentStatus = selectedRecentStatus === "Archivados" ? f.status : (statusKey || f.status);
    const statusHistoryEntry = f.statusHistory ? [...f.statusHistory].reverse().find(h => h.status === currentStatus) : null;
    const statusChangedDate = statusHistoryEntry?.timestamp ? formatCustomDateStr(statusHistoryEntry.timestamp) : null;

    const pendingTasksCount = f.tasks ? f.tasks.filter(t => !t.completed).length : 0;
    const totalTasksCount = f.tasks ? f.tasks.length : 0;

    switch (currentStatus) {
      case FestivalStatus.POR_ENVIAR:
        return (
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-medium flex-wrap mt-1">
            {f.deadline ? (
              <span className="bg-red-100/90 text-red-950 border border-red-200/80 px-2 py-0.5 rounded-md font-black flex items-center gap-1 shadow-2xs">
                <Clock className="h-3 w-3 text-red-600" />
                Cierre: {formatCustomDateStr(f.deadline)}
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-semibold">Sin fecha de cierre</span>
            )}
            {f.platform && (
              <span className="bg-white/90 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                Plataforma: {f.platform}
              </span>
            )}
            {(f.fee !== undefined && f.fee !== null && f.fee > 0) || f.price ? (
              <span className="text-emerald-700 font-black">
                Fee: ${f.fee || f.price}
              </span>
            ) : (
              <span className="text-slate-500 font-bold">Sin Fee ($0)</span>
            )}
            {totalTasksCount > 0 && (
              <span className={cn("px-2 py-0.5 rounded-md font-bold text-[9px]", pendingTasksCount > 0 ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-emerald-100 text-emerald-900 border border-emerald-200")}>
                {pendingTasksCount > 0 ? `${pendingTasksCount} tarea${pendingTasksCount > 1 ? 's' : ''} pendiente${pendingTasksCount > 1 ? 's' : ''}` : "Tareas listas ✓"}
              </span>
            )}
            {f.category && (
              <span className="text-slate-500">Cat: <strong className="text-slate-700">{f.category}</strong></span>
            )}
          </div>
        );

      case FestivalStatus.PROXIMAMENTE:
        return (
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-medium flex-wrap mt-1">
            {f.newsDate ? (
              <span className="bg-fuchsia-100/90 text-fuchsia-950 border border-fuchsia-200/80 px-2 py-0.5 rounded-md font-black flex items-center gap-1 shadow-2xs">
                <CalendarIcon className="h-3 w-3 text-fuchsia-600" />
                Noticias: {formatCustomDateStr(f.newsDate)}
              </span>
            ) : f.deadline ? (
              <span className="bg-fuchsia-50 text-fuchsia-900 border border-fuchsia-200 px-2 py-0.5 rounded-md font-bold">
                Apertura prox: {formatCustomDateStr(f.deadline)}
              </span>
            ) : null}
            {f.platform && (
              <span className="bg-white/90 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                Plataforma: {f.platform}
              </span>
            )}
            {f.category && (
              <span className="text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                {f.category}
              </span>
            )}
            {(f.fee !== undefined && f.fee !== null && f.fee > 0) || f.price ? (
              <span className="text-emerald-700 font-black">Fee: ${f.fee || f.price}</span>
            ) : (
              <span className="text-slate-500 font-medium">Sin Fee</span>
            )}
          </div>
        );

      case FestivalStatus.EN_REVISION:
        return (
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-medium flex-wrap mt-1">
            {f.newsDate ? (
              <span className="bg-orange-100/90 text-orange-950 border border-orange-200 px-2 py-0.5 rounded-md font-black flex items-center gap-1 shadow-2xs">
                <Clock className="h-3 w-3 text-orange-600" />
                Anuncio noticias: {formatCustomDateStr(f.newsDate)}
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">Sin fecha de noticias</span>
            )}
            {statusChangedDate && (
              <span className="text-slate-700 font-bold bg-white/90 border border-slate-200 px-2 py-0.5 rounded-md">
                Enviado: {statusChangedDate}
              </span>
            )}
            {f.platform && (
              <span className="text-slate-500 font-semibold">
                Plataforma: <strong className="text-slate-700">{f.platform}</strong>
              </span>
            )}
            {(f.fee !== undefined && f.fee !== null && f.fee > 0) || f.price ? (
              <span className="text-emerald-700 font-black">Fee: ${f.fee || f.price}</span>
            ) : (
              <span className="text-slate-500 font-semibold">Sin Fee ($0)</span>
            )}
          </div>
        );

      case FestivalStatus.EN_DUDA:
        return (
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-medium flex-wrap mt-1">
            {f.newsDate && (
              <span className="bg-violet-100/90 text-violet-950 border border-violet-200 px-2 py-0.5 rounded-md font-black">
                Noticias: {formatCustomDateStr(f.newsDate)}
              </span>
            )}
            {f.deadline && (
              <span className="text-slate-600 font-bold bg-white/90 border border-slate-200 px-2 py-0.5 rounded-md">
                Cierre: {formatCustomDateStr(f.deadline)}
              </span>
            )}
            {f.platform && (
              <span className="text-slate-500 font-semibold">
                Plataforma: <strong className="text-slate-700">{f.platform}</strong>
              </span>
            )}
            {f.observations && (
              <span className="text-slate-700 italic truncate max-w-[260px] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                "{f.observations}"
              </span>
            )}
          </div>
        );

      case FestivalStatus.SELECCIONADO:
        return (
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-medium flex-wrap mt-1">
            {f.projectionDate ? (
              <span className="bg-sky-100/90 text-sky-950 border border-sky-200 px-2.5 py-0.5 rounded-md font-black flex items-center gap-1 shadow-2xs">
                <Projector className="h-3 w-3 text-sky-600" />
                Proyección: {formatCustomDateStr(f.projectionDate)}
              </span>
            ) : (
              <span className="bg-sky-50 text-sky-900 border border-sky-200 px-2 py-0.5 rounded-md font-bold">
                Seleccionado ✓
              </span>
            )}
            {f.projectionLocation && (
              <span className="bg-white/90 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                <MapPin className="h-3 w-3 text-sky-500" />
                {f.projectionLocation}
              </span>
            )}
            {f.nomination && (
              <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                {f.nomination}
              </span>
            )}
            {f.newsDate && (
              <span className="text-slate-500">Notificado: <strong>{formatCustomDateStr(f.newsDate)}</strong></span>
            )}
          </div>
        );

      case FestivalStatus.PROYECTADO:
        return (
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-medium flex-wrap mt-1">
            {f.projectionDate ? (
              <span className="bg-indigo-100/90 text-indigo-950 border border-indigo-200 px-2.5 py-0.5 rounded-md font-black flex items-center gap-1 shadow-2xs">
                <Projector className="h-3 w-3 text-indigo-600" />
                Proyectado: {formatCustomDateStr(f.projectionDate)}
              </span>
            ) : statusChangedDate ? (
              <span className="bg-indigo-50 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-md font-bold">
                Proyectado el: {statusChangedDate}
              </span>
            ) : null}
            {f.projectionLocation && (
              <span className="bg-white/90 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                Locación: {f.projectionLocation}
              </span>
            )}
            {f.category && (
              <span className="text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                {f.category}
              </span>
            )}
          </div>
        );

      case FestivalStatus.GANADO:
        return (
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-medium flex-wrap mt-1">
            {f.nomination ? (
              <span className="bg-amber-100 text-amber-950 border border-amber-300 px-2.5 py-0.5 rounded-md font-black flex items-center gap-1 shadow-2xs">
                🏆 Premio: {f.nomination}
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-950 border border-amber-300 px-2 py-0.5 rounded-md font-black">
                🏆 Premio Concedido
              </span>
            )}
            {f.newsDate && (
              <span className="text-slate-600 font-bold bg-white/90 border border-slate-200 px-2 py-0.5 rounded-md">
                Ganado el: {formatCustomDateStr(f.newsDate)}
              </span>
            )}
            {f.category && (
              <span className="text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                {f.category}
              </span>
            )}
          </div>
        );

      case FestivalStatus.NO_SELECCIONADO:
        return (
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-medium flex-wrap mt-1">
            {f.newsDate ? (
              <span className="bg-rose-100/90 text-rose-950 border border-rose-200 px-2 py-0.5 rounded-md font-black">
                Notificación: {formatCustomDateStr(f.newsDate)}
              </span>
            ) : statusChangedDate ? (
              <span className="bg-rose-50 text-rose-900 border border-rose-200 px-2 py-0.5 rounded-md font-bold">
                Notificado el: {statusChangedDate}
              </span>
            ) : null}
            {f.platform && (
              <span className="text-slate-500 font-semibold">
                Plataforma: <strong className="text-slate-700">{f.platform}</strong>
              </span>
            )}
            {f.observations && (
              <span className="text-slate-600 italic truncate max-w-[260px] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                "{f.observations}"
              </span>
            )}
          </div>
        );

      case FestivalStatus.DESCALIFICADO:
        return (
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-medium flex-wrap mt-1">
            {f.observations ? (
              <span className="bg-slate-200 text-slate-900 border border-slate-300 px-2 py-0.5 rounded-md font-black">
                Causa: {f.observations}
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">Descalificado</span>
            )}
            {f.newsDate && (
              <span className="text-slate-500 font-semibold">
                Fecha noticias: <strong>{formatCustomDateStr(f.newsDate)}</strong>
              </span>
            )}
            {f.platform && (
              <span className="text-slate-500">Plataforma: {f.platform}</span>
            )}
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium flex-wrap mt-1">
            {f.category && (
              <span className="bg-white/90 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                {f.category}
              </span>
            )}
            {f.platform && (
              <span className="text-slate-500 font-semibold">
                Plataforma: <strong className="text-slate-700">{f.platform}</strong>
              </span>
            )}
            {f.deadline && (
              <span className="text-slate-500 font-semibold">
                Cierre: <strong className="text-slate-800 font-black">{formatCustomDateStr(f.deadline)}</strong>
              </span>
            )}
            {f.newsDate && (
              <span className="text-slate-500 font-semibold">
                Noticias: <strong className="text-slate-800 font-black">{formatCustomDateStr(f.newsDate)}</strong>
              </span>
            )}
          </div>
        );
    }
  };

  const recentPeriodFestivalsByStatus = useMemo(() => {
    const now = new Date();
    let start: Date;
    const end: Date = endOfDay(now);

    if (recentPeriod === "hoy") {
      start = startOfDay(now);
    } else if (recentPeriod === "semanal") {
      start = startOfDay(subDays(now, 7));
    } else if (recentPeriod === "mensual") {
      start = startOfDay(subDays(now, 30));
    } else if (recentPeriod === "60dias") {
      start = startOfDay(subDays(now, 60));
    } else if (recentPeriod === "90dias") {
      start = startOfDay(subDays(now, 90));
    } else {
      start = startOfDay(subDays(now, 7));
    }

    const isDateInRange = (dateStr?: string | null) => {
      if (!dateStr) return false;
      try {
        const d = parseISO(dateStr);
        if (!isValid(d)) return false;
        return isWithinInterval(d, { start, end });
      } catch {
        return false;
      }
    };

    // Filter all festivals (INCLUDING archived!) matching the period
    const periodFestivals = festivals.filter((f) => {
      if (f.statusHistory && f.statusHistory.some((sh) => isDateInRange(sh.timestamp))) {
        return true;
      }
      if (isDateInRange(f.createdAt) || isDateInRange(f.updatedAt)) return true;
      if (isDateInRange(f.deadline) || isDateInRange(f.newsDate) || isDateInRange(f.projectionDate)) return true;
      return false;
    });

    // Group by status + Archivados
    const grouped: Record<string, Festival[]> = {};
    Object.values(FestivalStatus).forEach((st) => {
      grouped[st] = [];
    });
    grouped["Archivados"] = [];

    periodFestivals.forEach((f) => {
      if (f.archived) {
        grouped["Archivados"].push(f);
      }
      const st = f.status || FestivalStatus.POR_ENVIAR;
      if (!grouped[st]) {
        grouped[st] = [];
      }
      grouped[st].push(f);
    });

    return {
      grouped,
      totalCount: periodFestivals.length,
      startDate: start,
      endDate: end
    };
  }, [festivals, recentPeriod]);

  // Excluded counts for specialized metrics
  const proximamenteCount = useMemo(() => {
    return festivals.filter((f) => !f.archived && f.status === FestivalStatus.PROXIMAMENTE).length;
  }, [festivals]);

  const archivedCount = useMemo(() => {
    return festivals.filter((f) => f.archived).length;
  }, [festivals]);

  // Data Health & Completeness Analytics (Excludes Archived, Próximamente, and No Seleccionado)
  const dataHealthStats = useMemo(() => {
    const eligibleForAudit = festivals.filter(
      (f) =>
        !f.archived &&
        f.status !== FestivalStatus.PROXIMAMENTE &&
        f.status !== FestivalStatus.NO_SELECCIONADO
    );

    if (!eligibleForAudit || eligibleForAudit.length === 0) {
      return {
        completionPercentage: 100,
        missingCountry: 0,
        missingCategory: 0,
        missingFee: 0,
        missingNewsDate: 0,
        incompleteFestivals: [],
        incompleteCount: 0,
        totalCount: 0
      };
    }

    let missingCountry = 0;
    let missingCategory = 0;
    let missingFee = 0;
    let missingNewsDate = 0;
    const incompleteFestivals: Festival[] = [];

    eligibleForAudit.forEach((f) => {
      const isMissingC = !f.country || f.country.trim() === "" || f.country.toLowerCase() === "por definir";
      const isMissingCat = !f.category || f.category.trim() === "";
      const isMissingFee = (f.fee === undefined || f.fee === null) && (!f.price || f.price.trim() === "");
      const isMissingNews = !f.newsDate;

      if (isMissingC) missingCountry++;
      if (isMissingCat) missingCategory++;
      if (isMissingFee) missingFee++;
      if (isMissingNews) missingNewsDate++;

      if (isMissingC || isMissingCat || isMissingFee || isMissingNews) {
        incompleteFestivals.push(f);
      }
    });

    const totalFieldsCheck = eligibleForAudit.length * 4;
    const filledFields = totalFieldsCheck - (missingCountry + missingCategory + missingFee + missingNewsDate);
    const completionPercentage = Math.round((filledFields / totalFieldsCheck) * 100);

    return {
      completionPercentage,
      missingCountry,
      missingCategory,
      missingFee,
      missingNewsDate,
      incompleteFestivals,
      incompleteCount: incompleteFestivals.length,
      totalCount: eligibleForAudit.length
    };
  }, [festivals]);

  // Helper to verify if a festival was actually submitted / passed through distribution pipeline
  const wasFestivalSubmitted = (f: Festival): boolean => {
    const submittedStatuses: string[] = [
      FestivalStatus.EN_REVISION,
      FestivalStatus.SELECCIONADO,
      FestivalStatus.PROYECTADO,
      FestivalStatus.GANADO,
      FestivalStatus.NO_SELECCIONADO,
      FestivalStatus.DESCALIFICADO,
    ];

    if (submittedStatuses.some((s) => s.toLowerCase() === f.status.toLowerCase())) {
      return true;
    }

    if (f.status.toLowerCase() === FestivalStatus.CERRADO.toLowerCase()) {
      if (f.statusHistory && f.statusHistory.length > 0) {
        return f.statusHistory.some((h) =>
          submittedStatuses.some((s) => s.toLowerCase() === h.status.toLowerCase())
        );
      }
      return false;
    }

    return false;
  };

  // Distribution Funnel & ROI Analytics (Excludes Archived, Por Enviar, En Duda, and Próximamente)
  const funnelStats = useMemo(() => {
    const roiEligibleFestivals = festivals.filter(
      (f) =>
        f.includeInStats !== false &&
        !f.archived &&
        f.status !== FestivalStatus.POR_ENVIAR &&
        f.status !== FestivalStatus.EN_DUDA &&
        f.status !== FestivalStatus.PROXIMAMENTE
    );

    const total = roiEligibleFestivals.length;

    // En Evaluación / Revisión
    const inReview = roiEligibleFestivals.filter(
      (f) => f.status.toLowerCase() === FestivalStatus.EN_REVISION.toLowerCase()
    ).length;

    // Seleccionados / Proyectados / Ganados
    const selected = roiEligibleFestivals.filter((f) =>
      [FestivalStatus.SELECCIONADO, FestivalStatus.PROYECTADO, FestivalStatus.GANADO].some(
        (s) => s.toLowerCase() === f.status.toLowerCase()
      )
    ).length;

    // Premiados / Ganados
    const won = roiEligibleFestivals.filter(
      (f) => f.status.toLowerCase() === FestivalStatus.GANADO.toLowerCase()
    ).length;

    // Rechazados / No Seleccionados / Descalificados
    const rejected = roiEligibleFestivals.filter((f) =>
      [FestivalStatus.NO_SELECCIONADO, FestivalStatus.DESCALIFICADO].some(
        (s) => s.toLowerCase() === f.status.toLowerCase()
      )
    ).length;

    const parseFee = (f: Festival): number => {
      // If closed without ever being submitted, no actual fee was spent
      if (!wasFestivalSubmitted(f)) {
        return 0;
      }
      if (f.fee !== undefined && f.fee !== null && !isNaN(Number(f.fee))) {
        return Number(f.fee);
      }
      if (f.price) {
        const str = f.price.trim().toLowerCase();
        if (
          !str ||
          str.includes("free") ||
          str.includes("gratis") ||
          str === "$0" ||
          str === "0" ||
          str === "0$" ||
          str === "$ 0" ||
          str === "por definir"
        ) {
          return 0;
        }
        const num = parseFloat(str.replace(/[^0-9.]/g, ""));
        return isNaN(num) ? 0 : num;
      }
      return 0;
    };

    const totalFees = roiEligibleFestivals.reduce((sum, f) => sum + parseFee(f), 0);
    const costPerSelection = selected > 0 ? Math.round(totalFees / selected) : 0;
    const conversionRate = total > 0 ? Math.round((selected / total) * 100) : 0;

    return {
      total,
      inReview,
      selected,
      won,
      rejected,
      totalFees,
      costPerSelection,
      conversionRate
    };
  }, [festivals]);

  const roiFestivalsData = useMemo(() => {
    const roiEligibleFestivals = festivals.filter(
      (f) =>
        f.includeInStats !== false &&
        !f.archived &&
        f.status !== FestivalStatus.POR_ENVIAR &&
        f.status !== FestivalStatus.EN_DUDA &&
        f.status !== FestivalStatus.PROXIMAMENTE
    );

    const parseFee = (f: Festival): number => {
      if (!wasFestivalSubmitted(f)) {
        return 0;
      }
      if (f.fee !== undefined && f.fee !== null && !isNaN(Number(f.fee))) {
        return Number(f.fee);
      }
      if (f.price) {
        const str = f.price.trim().toLowerCase();
        if (
          !str ||
          str.includes("free") ||
          str.includes("gratis") ||
          str === "$0" ||
          str === "0" ||
          str === "0$" ||
          str === "$ 0" ||
          str === "por definir"
        ) {
          return 0;
        }
        const num = parseFloat(str.replace(/[^0-9.]/g, ""));
        return isNaN(num) ? 0 : num;
      }
      return 0;
    };

    const list = roiEligibleFestivals.map((f) => ({
      festival: f,
      fee: parseFee(f),
      wasSubmitted: wasFestivalSubmitted(f),
    }));

    const totalFeesSum = list.reduce((sum, item) => sum + item.fee, 0);

    return {
      list,
      totalFeesSum,
      festivalsWithCostCount: list.filter((item) => item.fee > 0).length,
      freeFestivalsCount: list.filter((item) => item.fee === 0).length,
    };
  }, [festivals]);

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

    setDateFrom(format(start, 'yyyy-MM-dd'));
    setDateTo(format(end, 'yyyy-MM-dd'));
  };

  const handleClearRange = () => {
    setDateFrom("");
    setDateTo("");
  };

  const toggleStatus = (status: string) => {
    setMapVisibleStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  // Filtered festivals list based on date range (using deadline, newsDate, or projectionDate)
  const filteredFestivals = useMemo(() => {
    if (!dateFrom || !dateTo) return festivals;
    const from = startOfDay(parseISO(dateFrom));
    const to = endOfDay(parseISO(dateTo));
    if (!isValid(from) || !isValid(to)) return festivals;

    return festivals.filter((f) => {
      const itemDate = f.deadline 
        ? parseFestivalDate(f.deadline) 
        : (f.newsDate 
            ? parseFestivalDate(f.newsDate) 
            : (f.projectionDate 
                ? parseFestivalDate(f.projectionDate) 
                : null));
      if (!itemDate || !isValid(itemDate)) return false;
      return isWithinInterval(itemDate, { start: from, end: to });
    });
  }, [festivals, dateFrom, dateTo]);

  // Unified chronological status transitions (Traceability)
  const transitionsData = useMemo(() => {
    const list: {
      id: string;
      festivalId?: string;
      festivalName: string;
      previousStatus?: string;
      newStatus: string;
      timestamp: string;
      updatedBy?: string;
      note?: string;
      daysInPreviousStatus?: number;
    }[] = [];

    // statusHistory transitions
    festivals.forEach((f) => {
      if (f.statusHistory && f.statusHistory.length > 0) {
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

    // auditLog transitions
    if (auditLogs && auditLogs.length > 0) {
      auditLogs.forEach((log) => {
        if (!log.details) return;

        const quickMatch = log.details.match(/ha cambiado el estado de '(.*?)' a ([^.]*)/);
        if (quickMatch) {
          const festName = quickMatch[1].trim();
          const newStatus = quickMatch[2].trim();

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

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [festivals, auditLogs]);

  // Average Stays per Status calculation
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

  // Quick lookup map to associate transition records with full Festival objects
  const festivalMap = useMemo(() => {
    const map = new Map<string, Festival>();
    festivals.forEach((f) => {
      if (f.id) map.set(f.id, f);
      if (f.name) map.set(f.name.toLowerCase().trim(), f);
    });
    return map;
  }, [festivals]);

  // Filtered status transitions by date range, search and status filter
  const filteredTransitions = useMemo(() => {
    return transitionsData.filter((t) => {
      // 1. Date filter
      if (dateFrom && dateTo) {
        const from = startOfDay(parseISO(dateFrom));
        const to = endOfDay(parseISO(dateTo));
        const tDate = new Date(t.timestamp);
        if (isValid(from) && isValid(to)) {
          if (!isWithinInterval(tDate, { start: from, end: to })) {
            return false;
          }
        }
      }
      // 2. Status filter
      if (selectedStatusFilter !== "all") {
        if (t.newStatus !== selectedStatusFilter && t.previousStatus !== selectedStatusFilter) {
          return false;
        }
      }
      // 3. Search filter (matches festival name, user or notes)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = t.festivalName.toLowerCase().includes(term);
        const matchUser = t.updatedBy && t.updatedBy.toLowerCase().includes(term);
        const matchNote = t.note && t.note.toLowerCase().includes(term);
        if (!matchName && !matchUser && !matchNote) {
          return false;
        }
      }
      return true;
    });
  }, [transitionsData, dateFrom, dateTo, selectedStatusFilter, searchTerm]);

  // Bitácora Stats & Pagination
  const bitacoraStats = useMemo(() => {
    const total = filteredTransitions.length;
    const uniqueFestivals = new Set(filteredTransitions.map((t) => t.festivalName.toLowerCase().trim())).size;
    const uniqueUsers = new Set(filteredTransitions.map((t) => (t.updatedBy || "Sistema").toLowerCase().trim())).size;
    const latestDate =
      filteredTransitions.length > 0 && filteredTransitions[0].timestamp
        ? format(parseISO(filteredTransitions[0].timestamp), "dd/MM/yyyy HH:mm")
        : "-";
    return { total, uniqueFestivals, uniqueUsers, latestDate };
  }, [filteredTransitions]);

  const totalBitacoraPages = useMemo(() => {
    if (bitacoraPageSize === -1 || bitacoraPageSize === 0) return 1;
    return Math.ceil(filteredTransitions.length / bitacoraPageSize) || 1;
  }, [filteredTransitions.length, bitacoraPageSize]);

  const paginatedTransitions = useMemo(() => {
    if (bitacoraPageSize === -1) return filteredTransitions;
    const start = (bitacoraPage - 1) * bitacoraPageSize;
    return filteredTransitions.slice(start, start + bitacoraPageSize);
  }, [filteredTransitions, bitacoraPage, bitacoraPageSize]);

  const exportBitacoraCSV = () => {
    if (filteredTransitions.length === 0) return;
    const headers = [
      "Festival",
      "Estado Anterior",
      "Estado Nuevo",
      "Días Permanencia",
      "Modificado Por",
      "Nota/Detalle",
      "Fecha y Hora",
    ];
    const rows = filteredTransitions.map((t) => [
      `"${(t.festivalName || "").replace(/"/g, '""')}"`,
      `"${(t.previousStatus || "-").replace(/"/g, '""')}"`,
      `"${(t.newStatus || "").replace(/"/g, '""')}"`,
      t.daysInPreviousStatus !== undefined ? `${t.daysInPreviousStatus}` : "-",
      `"${(t.updatedBy || "Sistema").replace(/"/g, '""')}"`,
      `"${(t.note || "").replace(/"/g, '""')}"`,
      t.timestamp ? format(parseISO(t.timestamp), "yyyy-MM-dd HH:mm:ss") : "-",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bitacora_trazabilidad_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const projectionsList = festivals
    .filter(
      (f) =>
        f.projectionDate ||
        f.status === FestivalStatus.PROYECTADO ||
        f.status === FestivalStatus.GANADO,
    )
    .sort((a, b) => {
      const dateA = a.projectionDate ? new Date(a.projectionDate).getTime() : 0;
      const dateB = b.projectionDate ? new Date(b.projectionDate).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <div className="space-y-8 pb-32" id="stats-view">
      <div className="flex justify-center mb-6 px-2 overflow-x-hidden overflow-y-hidden">
        <div className="bg-white/60 p-1.5 rounded-2xl flex flex-wrap sm:flex-nowrap justify-center gap-1 border border-white/80 shadow-sm backdrop-blur-md w-max shrink-0 max-w-full">
          <button
            onClick={() => setActiveTab("stats")}
            className={cn(
              "px-4 sm:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === "stats"
                ? "bg-[#e91e63] text-white shadow-md"
                : "text-slate-500 hover:bg-white",
            )}
          >
            <BarChart3 className="h-4 w-4 shrink-0" />{" "}
            <span className="hidden sm:inline">Resumen Global</span>
            <span className="sm:hidden">Global</span>
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={cn(
              "px-4 sm:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === "map"
                ? "bg-[#3b82f6] text-white shadow-md"
                : "text-slate-500 hover:bg-white",
            )}
          >
            <Globe className="h-4 w-4 shrink-0" />{" "}
            <span className="hidden sm:inline">Mapa Mundial</span>
            <span className="sm:hidden">Mapa</span>
          </button>
          <button
            onClick={() => setActiveTab("projections")}
            className={cn(
              "w-full sm:w-auto justify-center px-4 sm:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === "projections"
                ? "bg-amber-500 text-white shadow-md"
                : "text-slate-500 hover:bg-white",
            )}
          >
            <Projector className="h-4 w-4 shrink-0" />{" "}
            <span className="hidden sm:inline">Proyecciones</span>
            <span className="sm:hidden">Proyecciones</span>
          </button>
        </div>
      </div>

      {activeTab === "stats" && (
        <div className="space-y-6">
          {/* SECCIÓN RESUMEN RECIENTE POR ESTADO */}
          <div className="glass-card p-6 border-l-4 border-l-indigo-600 bg-white relative overflow-hidden shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">RESUMEN POR ESTADO</h3>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {recentPeriodFestivalsByStatus.totalCount} festivales con actividad
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Festivales con actividad o fechas clave en el período seleccionado (incluye archivados). Haz clic en un estado para abrir su detalle.
                </p>
              </div>

              {/* Selector de Período Temporal */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { id: "hoy", label: "Hoy" },
                    { id: "semanal", label: "Semanal (Por defecto)" },
                    { id: "mensual", label: "Mensual" },
                    { id: "60dias", label: "Últ. 60 días" },
                    { id: "90dias", label: "Últ. 90 días" },
                  ] as const
                ).map((p) => {
                  const isActive = recentPeriod === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setRecentPeriod(p.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid de tarjetas por Estado + Archivados */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[...Object.values(FestivalStatus), "Archivados"].map((st) => {
                const list = recentPeriodFestivalsByStatus.grouped[st] || [];
                const count = list.length;
                const theme = getStatusTheme(st);

                return (
                  <button
                    key={st}
                    onClick={() => {
                      setSelectedRecentStatus(st);
                      setRecentSearchTerm("");
                    }}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between group cursor-pointer shadow-2xs hover:shadow-md min-w-0 overflow-hidden",
                      theme.bg,
                      theme.border
                    )}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-2 w-full min-w-0">
                      <span className={cn("text-[10px] font-black uppercase tracking-wider leading-tight min-w-0 truncate pr-1", theme.text)} title={st}>
                        {st}
                      </span>
                      <span className={cn("text-xs font-black px-2 py-0.5 rounded-full shrink-0 shadow-2xs min-w-6 text-center flex items-center justify-center leading-none", theme.badgeBg)}>
                        {count}
                      </span>
                    </div>
                    <div className={cn("flex items-center justify-between text-[9px] font-bold opacity-80 group-hover:opacity-100 transition-opacity w-full min-w-0", theme.subText)}>
                      <span className="truncate">{count === 1 ? '1 festival' : `${count} festivales`}</span>
                      <ChevronRight className="h-3 w-3 shrink-0 transform group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal de Detalle por Estado del Resumen Reciente */}
          {selectedRecentStatus && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
                {/* Modal Header */}
                {(() => {
                  const modalTheme = getStatusTheme(selectedRecentStatus);
                  return (
                    <div className={cn("p-5 border-b border-slate-200/60 flex items-center justify-between", modalTheme.bg)}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50/90 px-2.5 py-0.5 rounded-full border border-indigo-200">
                            {recentPeriod === "hoy" && "Período: Hoy"}
                            {recentPeriod === "semanal" && "Período: Semanal"}
                            {recentPeriod === "mensual" && "Período: Mensual"}
                            {recentPeriod === "60dias" && "Período: Últ. 60 días"}
                            {recentPeriod === "90dias" && "Período: Últ. 90 días"}
                          </span>
                          <h3 className={cn("text-base font-black tracking-tight flex items-center gap-2", modalTheme.text)}>
                            Festivales en "{selectedRecentStatus}"
                            <span className={cn("text-xs font-black px-2.5 py-0.5 rounded-full", modalTheme.badgeBg)}>
                              {(recentPeriodFestivalsByStatus.grouped[selectedRecentStatus] || []).length}
                            </span>
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Haz clic en cualquier festival para abrir sus detalles completos.
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedRecentStatus(null)}
                        className="p-2 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 rounded-full transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  );
                })()}

                {/* Search Bar inside Modal */}
                <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, país, categoría o plataforma..."
                      value={recentSearchTerm}
                      onChange={(e) => setRecentSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-500 shrink-0">
                    Total: {(recentPeriodFestivalsByStatus.grouped[selectedRecentStatus] || []).length}
                  </span>
                </div>

                {/* List of Festivals */}
                <div className="p-4 overflow-y-auto space-y-2.5 flex-1 bg-slate-50/30">
                  {(() => {
                    const rawList = recentPeriodFestivalsByStatus.grouped[selectedRecentStatus] || [];
                    const filtered = rawList.filter((f) => {
                      if (!recentSearchTerm) return true;
                      const term = recentSearchTerm.toLowerCase();
                      return (
                        f.name.toLowerCase().includes(term) ||
                        (f.country && f.country.toLowerCase().includes(term)) ||
                        (f.category && f.category.toLowerCase().includes(term)) ||
                        (f.platform && f.platform.toLowerCase().includes(term))
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium italic">
                          No hay festivales registrados en este estado para el período seleccionado {recentSearchTerm ? 'que coincidan con el filtro' : ''}.
                        </div>
                      );
                    }

                    return filtered.map((f) => {
                      const itemTheme = getStatusTheme(f.status || selectedRecentStatus, f.archived);
                      return (
                        <div
                          key={f.id}
                          onClick={() => {
                            setSelectedRecentStatus(null);
                            onViewDetails(f);
                          }}
                          className={cn(
                            "p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 group border-l-4",
                            itemTheme.bg,
                            itemTheme.border,
                            itemTheme.accentBorder,
                            itemTheme.hoverBg
                          )}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn("font-black text-sm transition-colors", itemTheme.text)}>
                                {f.name}
                              </span>
                              {f.status && selectedRecentStatus === "Archivados" && (
                                <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md", itemTheme.badgeBg)}>
                                  {f.status}
                                </span>
                              )}
                              {f.archived && (
                                <span className="bg-slate-700 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                                  Archivado
                                </span>
                              )}
                              {f.country && (
                                <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-slate-400" />
                                  {f.country}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[10px] text-slate-600 font-medium flex-wrap">
                              {f.category && (
                                <span className="bg-white/80 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                                  {f.category}
                                </span>
                              )}
                              {f.platform && (
                                <span className="text-slate-500 font-semibold">
                                  Plataforma: <strong className="text-slate-700">{f.platform}</strong>
                                </span>
                              )}
                              {(f.fee !== undefined && f.fee !== null && f.fee > 0) || f.price ? (
                                <span className="text-emerald-700 font-black">
                                  Fee: ${f.fee || f.price}
                                </span>
                              ) : (
                                <span className="text-slate-500">Sin Fee ($0)</span>
                              )}
                              {f.deadline && (
                                <span className="text-slate-500 font-semibold">
                                  Cierre: <strong className="text-slate-800 font-black">{formatCustomDateStr(f.deadline)}</strong>
                                </span>
                              )}
                              {f.newsDate && (
                                <span className="text-slate-500 font-semibold">
                                  Noticias: <strong className="text-slate-800 font-black">{formatCustomDateStr(f.newsDate)}</strong>
                                </span>
                              )}
                              {f.createdAt && (
                                <span className="text-slate-400">
                                  Creado: <strong className="text-slate-600 font-bold">{formatCustomDateStr(f.createdAt)}</strong>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <span className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1 shadow-2xs", itemTheme.btnBg)}>
                              Ver Detalle
                              <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
                  <button
                    onClick={() => setSelectedRecentStatus(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold uppercase transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header Card with Elegant Accent */}
          <div className="glass-card p-6 border-l-4 border-l-[#e91e63] bg-white relative overflow-hidden shadow-sm">
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#e91e63]" />
                  RESUMEN GLOBAL
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Análisis estratégico del proceso de distribución de la obra. Monitorea los tiempos de permanencia en cada estado, accede a los festivales más recientes y explora la bitácora de trazabilidad.
                </p>
              </div>
            </div>
          </div>

          {/* Unified Date Filter Container */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Filtrar Período de Análisis</span>
                <p className="text-xs text-slate-500 font-medium">Define el rango de fechas para calcular las métricas y la trazabilidad.</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    const today = new Date();
                    const start = startOfWeek(today, { weekStartsOn: 1 });
                    const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
                    setDateFrom(format(start, 'yyyy-MM-dd'));
                    setDateTo(format(end, 'yyyy-MM-dd'));
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600 uppercase transition-all shadow-sm"
                >
                  Semana Actual
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    setDateFrom(format(startOfMonth(today), 'yyyy-MM-dd'));
                    setDateTo(format(today, 'yyyy-MM-dd'));
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600 uppercase transition-all shadow-sm"
                >
                  Mes Actual
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    setDateFrom(format(subDays(today, 30), 'yyyy-MM-dd'));
                    setDateTo(format(today, 'yyyy-MM-dd'));
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600 uppercase transition-all shadow-sm"
                >
                  Últimos 30 días
                </button>
                <button
                  onClick={handleClearRange}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600 uppercase transition-all shadow-sm"
                >
                  Ver Histórico
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="w-full sm:w-auto flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 whitespace-nowrap font-black uppercase tracking-wider">Desde:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="w-full sm:w-auto flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 whitespace-nowrap font-black uppercase tracking-wider">Hasta:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={handleClearRange}
                  className="text-xs font-black uppercase text-rose-500 hover:text-rose-600 px-2 py-1"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {/* KPI Dashboard Cards & Specialized Metrics */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 text-center border-b-2 border-b-indigo-500">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">Movimientos</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">{filteredTransitions.length}</span>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">en el período seleccionado</span>
              </div>
              <div className="glass-card p-4 text-center border-b-2 border-b-emerald-500">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">Hitos de Éxito</span>
                <span className="text-2xl font-black text-emerald-500 mt-1 block">
                  +{filteredTransitions.filter(t => 
                    [FestivalStatus.SELECCIONADO, FestivalStatus.PROYECTADO, FestivalStatus.GANADO].some(st => st.toLowerCase() === t.newStatus.toLowerCase())
                  ).length}
                </span>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Selecciones o Premios</span>
              </div>
              <div className="glass-card p-4 text-center border-b-2 border-b-rose-500">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">Rechazos</span>
                <span className="text-2xl font-black text-rose-500 mt-1 block">
                  {filteredTransitions.filter(t => 
                    [FestivalStatus.NO_SELECCIONADO, FestivalStatus.DESCALIFICADO].some(st => st.toLowerCase() === t.newStatus.toLowerCase())
                  ).length}
                </span>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">No seleccionados o desc.</span>
              </div>
              <div className="glass-card p-4 text-center border-b-2 border-b-blue-500">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">Tasa de Éxito</span>
                <span className="text-2xl font-black text-blue-500 mt-1 block">
                  {(() => {
                    const sCount = filteredTransitions.filter(t => 
                      [FestivalStatus.SELECCIONADO, FestivalStatus.PROYECTADO, FestivalStatus.GANADO].some(st => st.toLowerCase() === t.newStatus.toLowerCase())
                    ).length;
                    const rCount = filteredTransitions.filter(t => 
                      [FestivalStatus.NO_SELECCIONADO, FestivalStatus.DESCALIFICADO].some(st => st.toLowerCase() === t.newStatus.toLowerCase())
                    ).length;
                    const total = sCount + rCount;
                    return total > 0 ? Math.round((sCount / total) * 100) : 0;
                  })()}%
                </span>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">proporción de hitos positivos</span>
              </div>
            </div>

            {/* Specialized Metrics: Próximamente & Archivados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-fuchsia-50/60 p-3 rounded-2xl border border-fuchsia-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-fuchsia-700 tracking-wider block">Festivales Próximamente</span>
                  <p className="text-[10px] text-fuchsia-600 font-medium">En agendamiento futuro (excluidos de métricas activas)</p>
                </div>
                <span className="text-xl font-black text-fuchsia-700 bg-white px-3 py-1 rounded-xl shadow-xs">{proximamenteCount}</span>
              </div>
              <div className="bg-slate-100/70 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider block">Festivales Archivados</span>
                  <p className="text-[10px] text-slate-500 font-medium">Fuera del circuito (excluidos de auditoría y ROI)</p>
                </div>
                <span className="text-xl font-black text-slate-700 bg-white px-3 py-1 rounded-xl shadow-xs">{archivedCount}</span>
              </div>
            </div>
          </div>

          {/* Advanced Analytics Grid: Data Health & Conversion Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Salud y Completitud de Datos */}
            <div className="glass-card p-5 space-y-4 relative overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    SALUD Y COMPLETITUD DE BASE DE DATOS
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Mide la calidad de los datos excluyendo festivales Próximamente, Archivados o No Seleccionados.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={cn(
                    "text-xl font-black block",
                    dataHealthStats.completionPercentage >= 80 ? "text-emerald-500" :
                    dataHealthStats.completionPercentage >= 50 ? "text-amber-500" : "text-rose-500"
                  )}>
                    {dataHealthStats.completionPercentage}%
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Índice de Salud</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500",
                      dataHealthStats.completionPercentage >= 80 ? "bg-emerald-500" :
                      dataHealthStats.completionPercentage >= 50 ? "bg-amber-500" : "bg-rose-500"
                    )}
                    style={{ width: `${dataHealthStats.completionPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>{dataHealthStats.totalCount - dataHealthStats.incompleteCount} Festivales evaluados completos</span>
                  <span>{dataHealthStats.incompleteCount} con datos faltantes</span>
                </div>
              </div>

              {/* Missing Fields Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                <div className="bg-slate-50/80 p-2 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Sin País</span>
                  <span className="text-sm font-black text-slate-700">{dataHealthStats.missingCountry}</span>
                </div>
                <div className="bg-slate-50/80 p-2 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Sin Categ.</span>
                  <span className="text-sm font-black text-slate-700">{dataHealthStats.missingCategory}</span>
                </div>
                <div className="bg-slate-50/80 p-2 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Sin Fee</span>
                  <span className="text-sm font-black text-slate-700">{dataHealthStats.missingFee}</span>
                </div>
                <div className="bg-slate-50/80 p-2 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Sin Fecha Notif.</span>
                  <span className="text-sm font-black text-slate-700">{dataHealthStats.missingNewsDate}</span>
                </div>
              </div>

              {dataHealthStats.incompleteCount > 0 && (
                <button
                  onClick={() => setShowIncompleteModal(true)}
                  className="w-full py-2 bg-amber-50 hover:bg-amber-100/80 text-amber-700 border border-amber-200/80 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  Auditar {dataHealthStats.incompleteCount} Festivales Incompletos
                </button>
              )}
            </div>

            {/* 2. Embudo de Distribución y Eficiencia ROI */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-500 shrink-0" />
                    EMBUDO DE DISTRIBUCIÓN Y RETORNO (ROI)
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Eficiencia excluyendo "Por enviar", "En duda" y "Próximamente".
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap justify-between sm:justify-end w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setRoiSearchTerm("");
                      setRoiFilterFeeOnly(false);
                      setShowRoiModal(true);
                    }}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs shrink-0"
                    title="Ver desglose detallado de gastos y porcentaje por festival"
                  >
                    <Search className="h-3.5 w-3.5 text-indigo-600" />
                    Auditar Gastos
                  </button>
                  <div className="text-right">
                    <span className="text-xl font-black text-indigo-600 block leading-tight">
                      ${funnelStats.totalFees.toLocaleString()}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block whitespace-normal leading-tight">
                      Inversión Total Fees
                    </span>
                  </div>
                </div>
              </div>

              {/* Funnel Pipeline Visual */}
              <div className="space-y-2 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-600 uppercase">1. Evaluados en ROI</span>
                    <span className="text-slate-800 font-black">{funnelStats.total} festivales</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-600 uppercase">2. En Evaluación / Revisión</span>
                    <span className="text-slate-800 font-black">{funnelStats.inReview}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${funnelStats.total > 0 ? (funnelStats.inReview / funnelStats.total) * 100 : 0}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-sky-600 uppercase">3. Seleccionados / Proyectados</span>
                    <span className="text-sky-700 font-black">{funnelStats.selected}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${funnelStats.total > 0 ? (funnelStats.selected / funnelStats.total) * 100 : 0}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-yellow-600 uppercase">4. Ganados / Premiados</span>
                    <span className="text-yellow-700 font-black">{funnelStats.won}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${funnelStats.total > 0 ? (funnelStats.won / funnelStats.total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>

              {/* Metrics Highlights */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-100/80 text-center">
                  <span className="text-[9px] uppercase font-black text-sky-600 tracking-wider block">Conversión Total</span>
                  <span className="text-base font-black text-sky-800">{funnelStats.conversionRate}%</span>
                  <span className="text-[8px] text-sky-500 font-bold block">pasan a Seleccionados</span>
                </div>
                <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/80 text-center">
                  <span className="text-[9px] uppercase font-black text-emerald-600 tracking-wider block">Costo / Selección</span>
                  <span className="text-base font-black text-emerald-800">
                    {funnelStats.costPerSelection > 0 ? `$${funnelStats.costPerSelection}` : "Gratuito"}
                  </span>
                  <span className="text-[8px] text-emerald-500 font-bold block">inversión promedio</span>
                </div>
              </div>
            </div>

          </div>

          {/* Grid Layout: Stays and Last 10 Festivals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Permanencia Promedio (Days per Status) */}
            <div className="glass-card p-5 space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#e91e63]" />
                  PERMANENCIA PROMEDIO (DÍAS POR ESTADO)
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  Mide el tiempo promedio que permanece un festival en cada estado antes de cambiar de fase.
                </p>
              </div>

              {averageDaysPerStatus.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-400 italic">
                  Registra cambios de estado en tus festivales para calcular los tiempos promedio de permanencia.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {averageDaysPerStatus.map((item, idx) => {
                    const norm = item.status.toLowerCase();
                    let badgeBg = "bg-slate-50 text-slate-600";
                    if (norm.includes('envi') || norm.includes('por enviar')) badgeBg = "bg-red-50 text-red-600 border-red-100 border";
                    else if (norm.includes('proximamente') || norm.includes('próximamente')) badgeBg = "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100 border";
                    else if (norm.includes('revision') || norm.includes('revisión')) badgeBg = "bg-orange-50 text-orange-600 border-orange-100 border";
                    else if (norm.includes('seleccionado')) badgeBg = "bg-sky-50 text-sky-600 border-sky-100 border";
                    else if (norm.includes('proyectado')) badgeBg = "bg-indigo-50 text-indigo-600 border-indigo-100 border";
                    else if (norm.includes('ganado')) badgeBg = "bg-yellow-50 text-yellow-600 border-yellow-200 border";
                    else if (norm.includes('no seleccionado')) badgeBg = "bg-rose-50 text-rose-600 border-rose-100 border";
                    else if (norm.includes('duda')) badgeBg = "bg-violet-50 text-violet-600 border-violet-100 border";
                    else if (norm.includes('descalificado')) badgeBg = "bg-slate-50 text-slate-600 border-slate-200 border";

                    return (
                      <div key={`${item.status}-${idx}`} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={cn("px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider", badgeBg)}>
                            {item.status}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            ({item.sampleCount} transiciones)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-black text-slate-800">~{item.avgDays}</span>
                          <span className="text-[10px] font-bold text-slate-400">días</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 2. Bitácora Completa y Detallada de Trazabilidad */}
          <div className="glass-card p-5 space-y-5">
            {/* Header & KPI Summary */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-600" />
                  BITÁCORA DETALLADA DE TRAZABILIDAD Y REGISTRO DE CAMBIOS
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Auditoría completa en tiempo real de transiciones de estado, movimientos del equipo y notas registradas.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={exportBitacoraCSV}
                  disabled={filteredTransitions.length === 0}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-40"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Exportar Bitácora CSV
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar for Bitácora */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Cambios</p>
                <p className="text-lg font-black text-slate-800">{bitacoraStats.total}</p>
              </div>
              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Festivales Impactados</p>
                <p className="text-lg font-black text-indigo-600">{bitacoraStats.uniqueFestivals}</p>
              </div>
              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuarios Activos</p>
                <p className="text-lg font-black text-blue-600">{bitacoraStats.uniqueUsers}</p>
              </div>
              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100/80">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Última Actividad</p>
                <p className="text-xs font-bold text-slate-700 mt-1 truncate">{bitacoraStats.latestDate}</p>
              </div>
            </div>

            {/* Filters and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
                <input
                  type="text"
                  placeholder="Buscar festival, usuario o nota..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setBitacoraPage(1);
                  }}
                  className="px-2 py-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setBitacoraPage(1);
                    }}
                    className="p-1 hover:bg-slate-200 rounded-full text-slate-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Estado:</span>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => {
                      setSelectedStatusFilter(e.target.value);
                      setBitacoraPage(1);
                    }}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="all">Todos los estados</option>
                    {Object.values(FestivalStatus).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Mostrar:</span>
                  <select
                    value={bitacoraPageSize}
                    onChange={(e) => {
                      setBitacoraPageSize(Number(e.target.value));
                      setBitacoraPage(1);
                    }}
                    className="px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value={10}>10 filas</option>
                    <option value={25}>25 filas</option>
                    <option value={50}>50 filas</option>
                    <option value={100}>100 filas</option>
                    <option value={-1}>Ver Todos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            {filteredTransitions.length === 0 ? (
              <div className="p-10 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 italic">
                No se encontraron registros de cambios en el período o coincidiendo con la búsqueda.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-[9px] font-black uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-3">Festival</th>
                        <th className="py-3 px-3">Cambio de Estado</th>
                        <th className="py-3 px-3">Permanencia</th>
                        <th className="py-3 px-3">Modificado por</th>
                        <th className="py-3 px-3">Detalle / Notas</th>
                        <th className="py-3 px-3">Fecha y Hora</th>
                        <th className="py-3 px-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {paginatedTransitions.map((item, idx) => {
                        const matchedFest = item.festivalId
                          ? festivalMap.get(item.festivalId) || festivalMap.get(item.festivalName.toLowerCase().trim())
                          : festivalMap.get(item.festivalName.toLowerCase().trim());

                        const normNew = item.newStatus.toLowerCase();
                        let badgeNew = "bg-slate-50 text-slate-600 border-slate-200 border";
                        if (normNew.includes('envi') || normNew.includes('por enviar')) badgeNew = "bg-red-50 text-red-600 border-red-100 border";
                        else if (normNew.includes('proximamente') || normNew.includes('próximamente')) badgeNew = "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100 border";
                        else if (normNew.includes('revision') || normNew.includes('revisión')) badgeNew = "bg-orange-50 text-orange-600 border-orange-100 border";
                        else if (normNew.includes('seleccionado')) badgeNew = "bg-sky-50 text-sky-600 border-sky-100 border";
                        else if (normNew.includes('proyectado')) badgeNew = "bg-indigo-50 text-indigo-600 border-indigo-100 border";
                        else if (normNew.includes('ganado')) badgeNew = "bg-yellow-50 text-yellow-700 border-yellow-200 border";
                        else if (normNew.includes('no seleccionado')) badgeNew = "bg-rose-50 text-rose-600 border-rose-100 border";
                        else if (normNew.includes('duda')) badgeNew = "bg-violet-50 text-violet-600 border-violet-100 border";
                        else if (normNew.includes('descalificado')) badgeNew = "bg-slate-50 text-slate-600 border-slate-200 border";

                        let badgePrev = "bg-slate-50 text-slate-400 border-slate-100 border";
                        if (item.previousStatus) {
                          const normPrev = item.previousStatus.toLowerCase();
                          if (normPrev.includes('envi') || normPrev.includes('por enviar')) badgePrev = "bg-red-50/60 text-red-500 border-red-100 border";
                          else if (normPrev.includes('proximamente') || normPrev.includes('próximamente')) badgePrev = "bg-fuchsia-50/60 text-fuchsia-500 border-fuchsia-100 border";
                          else if (normPrev.includes('revision') || normPrev.includes('revisión')) badgePrev = "bg-orange-50/60 text-orange-500 border-orange-100 border";
                          else if (normPrev.includes('seleccionado')) badgePrev = "bg-sky-50/60 text-sky-500 border-sky-100 border";
                          else if (normPrev.includes('proyectado')) badgePrev = "bg-indigo-50/60 text-indigo-500 border-indigo-100 border";
                          else if (normPrev.includes('ganado')) badgePrev = "bg-yellow-50/60 text-yellow-600 border-yellow-200 border";
                          else if (normPrev.includes('no seleccionado')) badgePrev = "bg-rose-50/60 text-rose-500 border-rose-100 border";
                          else if (normPrev.includes('duda')) badgePrev = "bg-violet-50/60 text-violet-500 border-violet-100 border";
                          else if (normPrev.includes('descalificado')) badgePrev = "bg-slate-50/60 text-slate-500 border-slate-200 border";
                        }

                        const formattedDate = item.timestamp
                          ? format(parseISO(item.timestamp), "dd/MM/yyyy HH:mm")
                          : "-";

                        return (
                          <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                            {/* Festival Info */}
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-800 block">{item.festivalName}</span>
                              {matchedFest && (
                                <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                                  {matchedFest.country}{matchedFest.category ? ` • ${matchedFest.category}` : ''}
                                </span>
                              )}
                            </td>

                            {/* Status Change */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {item.previousStatus ? (
                                  <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider", badgePrev)}>
                                    {item.previousStatus}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 italic text-[10px]">-</span>
                                )}
                                <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className={cn("px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-2xs", badgeNew)}>
                                  {item.newStatus}
                                </span>
                              </div>
                            </td>

                            {/* Permanence */}
                            <td className="py-3 px-3 font-semibold text-slate-600">
                              {item.daysInPreviousStatus !== undefined ? (
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                  {item.daysInPreviousStatus} días
                                </span>
                              ) : (
                                <span className="text-slate-300 italic">-</span>
                              )}
                            </td>

                            {/* Updated By */}
                            <td className="py-3 px-3 font-medium text-slate-600">
                              <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 text-[10px]">
                                <User className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="font-bold text-slate-700">{item.updatedBy || "Sistema"}</span>
                              </span>
                            </td>

                            {/* Note / Detail */}
                            <td className="py-3 px-3 text-[11px] text-slate-500 max-w-[200px]">
                              {item.note ? (
                                <span className="block truncate text-slate-600 bg-amber-50/60 text-amber-900 border border-amber-100 px-2 py-0.5 rounded-md text-[10px]" title={item.note}>
                                  {item.note}
                                </span>
                              ) : (
                                <span className="text-slate-300 italic text-[10px]">Sin notas</span>
                              )}
                            </td>

                            {/* Timestamp */}
                            <td className="py-3 px-3 text-slate-500 font-mono text-[10px]">
                              {formattedDate}
                            </td>

                            {/* Action */}
                            <td className="py-3 px-3 text-right">
                              {matchedFest ? (
                                <button
                                  onClick={() => onViewDetails(matchedFest)}
                                  className="px-2.5 py-1 bg-[#e91e63]/10 hover:bg-[#e91e63] text-[#e91e63] hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                                >
                                  Ver
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </button>
                              ) : (
                                <span className="text-slate-300 text-[10px] italic">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {bitacoraPageSize !== -1 && totalBitacoraPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                    <p className="text-[11px] font-medium text-slate-500">
                      Mostrando <span className="font-bold text-slate-700">{(bitacoraPage - 1) * bitacoraPageSize + 1}</span> a{" "}
                      <span className="font-bold text-slate-700">
                        {Math.min(bitacoraPage * bitacoraPageSize, filteredTransitions.length)}
                      </span>{" "}
                      de <span className="font-bold text-slate-700">{filteredTransitions.length}</span> registros
                    </p>

                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={bitacoraPage === 1}
                        onClick={() => setBitacoraPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                      >
                        Anterior
                      </button>

                      <span className="px-2 text-xs font-bold text-slate-600">
                        Pág. {bitacoraPage} de {totalBitacoraPages}
                      </span>

                      <button
                        disabled={bitacoraPage >= totalBitacoraPages}
                        onClick={() => setBitacoraPage((p) => Math.min(totalBitacoraPages, p + 1))}
                        className="px-3 py-1 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "projections" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-amber-50/80 p-4 rounded-xl border border-amber-100 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Projector className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-black tracking-tight text-slate-800 leading-none">
                {projectionsList.length}{" "}
                <span className="text-slate-500 font-medium text-lg">
                  Proyecciones
                </span>
              </p>
              <p className="text-[10px] uppercase font-black tracking-widest text-amber-600/70 mt-1">
                Registradas hasta la fecha
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectionsList.map((f, idx) => {
              let statusTag = null;
              if (f.projectionDate) {
                const pd = parseFestivalDate(f.projectionDate);
                if (pd) {
                  const todayStart = new Date();
                  todayStart.setHours(0, 0, 0, 0);
                  const todayEnd = new Date();
                  todayEnd.setHours(23, 59, 59, 999);
                  if (pd.getTime() < todayStart.getTime()) {
                    statusTag = (
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">
                        Ya proyectado
                      </span>
                    );
                  } else if (
                    pd.getTime() >= todayStart.getTime() &&
                    pd.getTime() <= todayEnd.getTime()
                  ) {
                    statusTag = (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest border border-emerald-300 shadow-sm">
                        ¡HOY!
                      </span>
                    );
                  } else {
                    statusTag = (
                      <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest border border-indigo-300 shadow-sm">
                        Próximamente
                      </span>
                    );
                  }
                }
              }
              return (
                <div
                  key={`${f.id}-${idx}`}
                  className="glass-card p-6 flex flex-col gap-4 border-t-4 border-t-amber-400 hover:-translate-y-1 transition-transform cursor-pointer relative"
                  onClick={() => onViewDetails(f)}
                >
                  {" "}
                  {statusTag && (
                    <div className="absolute -top-3 left-4 mt-2">
                      {statusTag}
                    </div>
                  )}
                  {f.laurel && (
                    <div className="flex justify-center mb-2">
                      <img
                        src={f.laurel}
                        alt="Laurel"
                        className="h-16 object-contain rounded p-1"
                        style={{
                          backgroundColor:
                            f.laurelBg === "white"
                              ? "#ffffff"
                              : f.laurelBg === "black"
                                ? "#000000"
                                : "transparent",
                        }}
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800">{f.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1 line-clamp-1">
                        {f.category || "Competencia Oficial"}
                      </p>
                    </div>
                    <div className="bg-amber-100 rounded-full p-2 shrink-0">
                      <Projector className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                      <span className="shrink-0 mt-0.5">
                        <CalendarIcon className="h-4 w-4 text-amber-500" />
                      </span>
                      <span className="font-medium text-xs break-words leading-tight">
                        {formatDisplayDate(f.projectionDate)}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                      <span className="shrink-0 mt-0.5">
                        <MapPin className="h-4 w-4 text-amber-500" />
                      </span>
                      <span
                        className="font-medium text-xs break-words leading-tight"
                        title={f.projectionLocation || "Locación a confirmar"}
                      >
                        {f.projectionLocation || "Locación a confirmar"}
                      </span>
                    </div>
                    {f.nomination && (
                      <div className="flex flex-col gap-1 text-sm text-slate-600 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                        <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">
                          Nom. / Premio:
                        </span>
                        <span className="font-bold text-xs text-amber-500 break-words leading-tight">
                          {f.nomination}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {projectionsList.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                No hay festivales con estado "Proyectado", "Ganado", o que
                tengan una fecha de proyección.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "map" && (
        <div className="flex flex-col gap-4">
          <div className="glass-card p-1 sm:p-2 w-full h-[350px] sm:h-[600px] flex flex-col relative overflow-hidden">
            <div className="flex-1 rounded-2xl overflow-hidden bg-slate-100 w-full h-full shadow-inner relative">
              <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ width: "100%", height: "100%", zIndex: 0 }}
              >
                <MapUpdater />
                <TileLayer
                  attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {festivals
                  .filter((f) => f.projectionLat && f.projectionLng)
                  .filter((f) => {
                    const isProj = !!f.projectionDate || !!f.projectionLocation;
                    if (mapVisibleStatuses.includes("PROYECCIONES") && isProj)
                      return true;
                    if (mapVisibleStatuses.includes(f.status)) return true;
                    return false;
                  })
                  .map((festival, idx) => {
                    const isProjection =
                      !!festival.projectionDate ||
                      !!festival.projectionLocation;
                    return (
                      <MapMarkerWithInfo
                        key={`${festival.id}-${idx}`}
                        festival={festival}
                        onViewDetails={onViewDetails}
                        isProjection={isProjection}
                      />
                    );
                  })}
                {/* Mystery Antarctica Marker */}
                <LeafletMarker
                  position={[-82.8628, 135.0]}
                  icon={createMysteryIcon()}
                >
                  <LeafletPopup className="custom-popup">
                    <div className="p-2 sm:p-3 min-w-[160px] text-center flex flex-col items-center">
                      <h4 className="font-black text-slate-800 text-sm sm:text-base uppercase tracking-widest mb-1 text-pink-500">
                        Que es esto?
                      </h4>
                      <p className="text-xs text-slate-500 mb-3 font-bold">
                        ???
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          document
                            .getElementById("btn-play-zone-portal")
                            ?.click();
                        }}
                        className="w-full bg-black text-white text-[10px] uppercase font-black tracking-widest py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-xl"
                      >
                        ENTRAR
                      </button>
                    </div>
                  </LeafletPopup>
                </LeafletMarker>
              </MapContainer>
            </div>
          </div>
          <div className="glass-card p-4">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3">
              Habilitar en el mapa:
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleStatus("PROYECCIONES")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border-2",
                  mapVisibleStatuses.includes("PROYECCIONES")
                    ? "bg-[#eab308] border-[#eab308] text-white shadow-md shadow-[#eab308]/20"
                    : "bg-white border-slate-200 text-slate-400 hover:border-[#eab308] hover:text-[#eab308]",
                )}
              >
                Proyecciones
              </button>
              {Object.values(FestivalStatus).map((status, idx) => {
                const color = STATUS_COLORS[status] || "#3b82f6";
                const isActive = mapVisibleStatuses.includes(status);
                return (
                  <button
                    key={`${status}-${idx}`}
                    onClick={() => toggleStatus(status)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all border-2",
                    )}
                    style={{
                      backgroundColor: isActive ? color : "white",
                      borderColor: isActive ? color : "#e2e8f0",
                      color: isActive ? "white" : "#94a3b8",
                      boxShadow: isActive
                        ? `0 4px 6px -1px ${color}40`
                        : "none",
                    }}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Audit Modal for Incomplete Festival Records */}
      {showIncompleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Auditoría de Registros Incompletos ({dataHealthStats.incompleteCount})
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Listado de festivales a los que les faltan campos clave para completar las métricas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIncompleteModal(false)}
                className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3 divide-y divide-slate-100">
              {dataHealthStats.incompleteFestivals.map((f, idx) => {
                const missingList: string[] = [];
                if (!f.country || f.country.trim() === "" || f.country.toLowerCase() === "por definir") missingList.push("País");
                if (!f.category || f.category.trim() === "") missingList.push("Categoría");
                if ((f.fee === undefined || f.fee === null) && (!f.price || f.price.trim() === "")) missingList.push("Inversión / Fee");
                if (!f.newsDate) missingList.push("Fecha Notificación");

                return (
                  <div key={`${f.id || 'inc'}-${idx}`} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{f.name}</h4>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Campos Faltantes:</span>
                        {missingList.map((m, mIdx) => (
                          <span key={`${f.id}-${m}-${mIdx}`} className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-md text-[9px] font-black uppercase">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowIncompleteModal(false);
                        onViewDetails(f);
                      }}
                      className="px-3 py-1.5 bg-[#e91e63] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-pink-700 transition-colors shrink-0 shadow-sm"
                    >
                      Ver Festival
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowIncompleteModal(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-900 transition-colors"
              >
                Cerrar Auditoría
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Auditoría de Gastos y Fees (ROI) */}
      {showRoiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/60">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    Auditoría de Inversión y Fees (ROI)
                    <span className="text-xs font-black text-indigo-700 bg-white px-2.5 py-0.5 rounded-full shadow-2xs border border-indigo-100">
                      ${roiFestivalsData.totalFeesSum.toLocaleString()} USD
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Desglose de gastos por festival y porcentaje de participación sobre el total invertido.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRoiModal(false)}
                className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Controls & Search */}
            <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar festival por nombre, país, categoría o estado..."
                  value={roiSearchTerm}
                  onChange={(e) => setRoiSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setRoiFilterFeeOnly(!roiFilterFeeOnly)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer",
                    roiFilterFeeOnly
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {roiFilterFeeOnly
                    ? `Solo con Fee > $0 (${roiFestivalsData.festivalsWithCostCount})`
                    : `Todos los Evaluados (${roiFestivalsData.list.length})`}
                </button>
              </div>
            </div>

            {/* Modal Body - List of festivals with percentages & visual bars */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2 bg-slate-50/40">
              {(() => {
                const filtered = roiFestivalsData.list.filter(({ festival: f, fee }) => {
                  if (roiFilterFeeOnly && fee <= 0) return false;
                  if (!roiSearchTerm) return true;
                  const term = roiSearchTerm.toLowerCase();
                  return (
                    f.name.toLowerCase().includes(term) ||
                    (f.country && f.country.toLowerCase().includes(term)) ||
                    (f.category && f.category.toLowerCase().includes(term)) ||
                    (f.status && f.status.toLowerCase().includes(term))
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 font-medium italic">
                      No se encontraron festivales {roiFilterFeeOnly ? 'con tarifa/fee registrada' : ''} {roiSearchTerm ? 'que coincidan con la búsqueda' : ''}.
                    </div>
                  );
                }

                return filtered.map(({ festival: f, fee, wasSubmitted }, idx) => {
                  const percentage = roiFestivalsData.totalFeesSum > 0 ? (fee / roiFestivalsData.totalFeesSum) * 100 : 0;
                  const itemTheme = getStatusTheme(f.status, f.archived);

                  return (
                    <div
                      key={`roi-item-${f.id || idx}`}
                      className="p-3.5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
                    >
                      {/* Info principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-slate-800 text-xs truncate max-w-xs">{f.name}</h4>
                          <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border", itemTheme.bg, itemTheme.text, itemTheme.border)}>
                            {f.status}
                          </span>
                          {!wasSubmitted && f.status === FestivalStatus.CERRADO && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Cerrado sin envío
                            </span>
                          )}
                          {f.country && (
                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                              {f.country}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          Plataforma: {f.platform || "Directa"} • Categoría: {f.category || "General"}
                        </p>
                      </div>

                      {/* Desglose de Pago & Barra Visual de Porcentaje */}
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <div className="flex items-center gap-1.5 sm:justify-end">
                            <span className="text-xs font-black text-slate-900">
                              {fee > 0 ? `$${fee.toLocaleString()} USD` : (!wasSubmitted ? "$0 USD" : "Gratis")}
                            </span>
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>

                          {/* Visual Progress Bar */}
                          <div className="w-28 sm:w-36 bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(fee > 0 ? 3 : 0, percentage))}%` }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setShowRoiModal(false);
                            onViewDetails(f);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors shrink-0 shadow-2xs cursor-pointer"
                        >
                          Ver
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer Summary */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 flex-wrap">
                <span>Inversión Total: <strong className="text-slate-800 font-black">${roiFestivalsData.totalFeesSum.toLocaleString()} USD</strong></span>
                <span>•</span>
                <span>Con Pago: <strong className="text-indigo-600 font-black">{roiFestivalsData.festivalsWithCostCount}</strong></span>
                <span>•</span>
                <span>Gratuitos: <strong className="text-emerald-600 font-black">{roiFestivalsData.freeFestivalsCount}</strong></span>
              </div>
              <button
                onClick={() => setShowRoiModal(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-900 transition-colors w-full sm:w-auto cursor-pointer"
              >
                Cerrar Auditoría
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
