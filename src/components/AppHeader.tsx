import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { Home, Menu, Search, Calendar as CalendarIcon, AtSign, X, SlidersHorizontal, ChevronDown, Globe, Check, Smartphone, Download, RotateCcw, Pencil, Command, BookOpen, Film } from "lucide-react";
import { cn } from "../utils/helpers";
import { NetworkStatusBadge } from "./NetworkStatusBadge";
import { useSkin } from "../context/SkinContext";
import { useProject } from "../context/ProjectContext";

type View =
  | "festivals"
  | "calendar"
  | "stats"
  | "notes"
  | "details"
  | "dashboard"
  | "config"
  | "help"
  | "tasks"
  | "easter_egg"
  | "reports"
  | "bugs"
  | "film_data"
  | "gallery"
  | "archive"
  | "architecture_map"
  | "play_zone"
  | "social_media"
  | "planning"
  | "theme_showcase"
  | "distribution_plans"
  | "distribution_plan_detail"
  | "docs";

interface AppHeaderProps {
  view: View;
  setView: (v: View) => void;
  onReloadPlanning?: () => void;
  search: string;
  setSearch: (s: string) => void;
  dateFilter: string;
  setDateFilter: (f: string) => void;
  dateRangeStart: string;
  setDateRangeStart: (s: string) => void;
  dateRangeEnd: string;
  setDateRangeEnd: (s: string) => void;
  setIsSidebarOpen: (v: boolean) => void;
  hasBirthdayToday?: boolean;
  searchInObs: boolean;
  setSearchInObs: (v: boolean) => void;
  onlyFree: boolean;
  setOnlyFree: (v: boolean) => void;
  onlyWithTasks: boolean;
  setOnlyWithTasks: (v: boolean) => void;
  selectedCountries: string[];
  setSelectedCountries: (c: string[]) => void;
  availableCountries: string[];
  deferredPrompt?: any;
  handleInstallClick?: () => Promise<void>;
  onOpenOmnibox?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  view,
  setView,
  onReloadPlanning,
  search,
  setSearch,
  dateFilter,
  setDateFilter,
  dateRangeStart,
  setDateRangeStart,
  dateRangeEnd,
  setDateRangeEnd,
  setIsSidebarOpen,
  hasBirthdayToday,
  searchInObs,
  setSearchInObs,
  onlyFree,
  setOnlyFree,
  onlyWithTasks,
  setOnlyWithTasks,
  selectedCountries,
  setSelectedCountries,
  availableCountries,
  deferredPrompt,
  handleInstallClick,
  onOpenOmnibox,
}) => {
  const { activeSkin } = useSkin();
  const { currentProject, setCurrentProject } = useProject();
  const isDark = activeSkin === "cardigan-noche" || activeSkin === "dark";
  const { scrollY } = useScroll();
  const [showSearchOptions, setShowSearchOptions] = React.useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  useEffect(() => {
    if (hasBirthdayToday) {
      import("canvas-confetti").then((confetti) => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.2 },
          colors: ["#e91e63", "#a855f7", "#fbbf24"],
        });
      });
    }
  }, [hasBirthdayToday]);

  const headerTop = useTransform(scrollY, [0, 100], [16, 8]);
  const headerMaxWidth = useTransform(scrollY, [0, 100], [672, 448]);
  const headerPadding = useTransform(scrollY, [0, 100], [16, 12]);
  const headerRadius = useTransform(scrollY, [0, 100], [32, 16]);

  const titleHeight = useTransform(scrollY, [0, 100], [40, 0]);
  const titleOpacity = useTransform(scrollY, [0, 80], [1, 0]);
  const titleMargin = useTransform(scrollY, [0, 100], [16, 0]);

  const quickBtnWidth = useTransform(scrollY, [0, 80], [0, 40]);
  const quickBtnOpacity = useTransform(scrollY, [50, 100], [0, 1]);

  return (
    <>
      <motion.header
        style={{ paddingTop: headerTop }}
        className="fixed left-0 right-0 z-50 pointer-events-none flex justify-center w-full px-4 no-print"
      >
      <motion.div
        style={{
          maxWidth: view === "planning" ? "80rem" : headerMaxWidth,
          padding: headerPadding,
          borderRadius: headerRadius,
        }}
        className={cn(
          "pointer-events-auto w-full flex flex-col border shadow-xl overflow-hidden transition-colors duration-200",
          isDark 
            ? "bg-slate-900 border-slate-800 shadow-slate-950/80 text-slate-100" 
            : "bg-white border-slate-200 shadow-slate-200/50 text-slate-800"
        )}
      >
        <motion.div
          style={{
            height: view === "planning" ? "auto" : titleHeight,
            opacity: view === "planning" ? 1 : titleOpacity,
            marginBottom: view === "planning" ? 0 : titleMargin,
          }}
          className="flex justify-between items-center w-full px-1 overflow-hidden shrink-0"
        >
          <div className="flex items-center gap-2">
            <button
              id="btn-auto-28"
              onClick={() => {
                setView("dashboard");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={cn(
                "text-2xl font-black tracking-tighter uppercase transition-all hover:tracking-normal flex items-center gap-2",
                view === "social_media" ? "text-sky-500" : view === "planning" ? "text-purple-400" : isDark ? "text-slate-100" : "text-slate-800",
              )}
            >
              {view === "social_media" ? (
                <span>Redes</span>
              ) : view === "planning" ? (
                <span className="flex items-center gap-1.5">
                  <Pencil className="h-6 w-6 text-purple-400 sm:hidden" />
                  <span className="hidden sm:inline">Pizarra</span>
                  <span className={cn(
                    "px-1.5 py-0.5 text-[10px] font-bold border rounded-md",
                    isDark ? "bg-amber-950/60 text-amber-300 border-amber-800" : "bg-amber-100 text-amber-800 border-amber-300"
                  )}>
                    En progreso
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-2.5">
                  {currentProject?.iconUrl ? (
                    <img 
                      src={currentProject.iconUrl} 
                      alt={currentProject.name} 
                      className="h-9 w-9 rounded-xl object-cover shrink-0 hover:scale-105 transition-transform border border-slate-200 shadow-sm" 
                    />
                  ) : (
                    <div 
                      className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm"
                      style={{ backgroundColor: currentProject?.theme?.colorDominante || '#e91e63' }}
                    >
                      {currentProject?.name ? currentProject.name.slice(0, 2).toUpperCase() : 'FE'}
                    </div>
                  )}
                  <span className={cn("text-sm font-bold truncate max-w-[120px] sm:max-w-[200px]", isDark ? "text-pink-400" : "text-[#e91e63]")}>
                    {currentProject?.name || 'Festis'}
                  </span>
                </span>
              )}
            </button>

            {/* Botón para regresar a la vista de proyectos */}
            <button
              type="button"
              onClick={() => setCurrentProject(null)}
              className={cn(
                "h-8 px-2.5 flex items-center gap-1.5 rounded-xl border text-[11px] font-semibold hover:scale-105 active:scale-95 transition-all",
                isDark ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700" : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              )}
              title="Volver al selector de proyectos"
            >
              <Film className="w-3.5 h-3.5 text-pink-600" />
              <span className="hidden sm:inline">Obras</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <NetworkStatusBadge />
            {view === "planning" && (
              <button
                onClick={() => {
                  setView("festivals");
                }}
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-xl shadow-sm border hover:scale-105 active:scale-95 transition-all",
                  isDark ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
                )}
                title="Buscar Festivales"
              >
                <Search className={cn("h-4 w-4", isDark ? "text-pink-400" : "text-[#e91e63]")} />
              </button>
            )}
            {view === "planning" && onReloadPlanning && (
              <button
                onClick={onReloadPlanning}
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all relative border",
                  isDark ? "bg-purple-950/60 text-purple-300 hover:bg-purple-900 border-purple-800" : "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 shadow-purple-500/10"
                )}
                title="Recargar Pizarra Excalidraw"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            {view !== "planning" && (
              <button
                id="btn-pwa-install-mobile"
                onClick={() => setIsInstallModalOpen(true)}
                className="h-10 w-10 sm:hidden flex items-center justify-center rounded-xl bg-gradient-to-br from-[#e91e63] to-pink-500 text-white shadow-md shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all relative"
                title="Instalar Festis en celular"
              >
                <Smartphone className="h-5 w-5" />
              </button>
            )}
            {view === "social_media" ? (
              <button
                onClick={() => {
                  setView("dashboard");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "h-10 w-10 flex items-center justify-center rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all relative border",
                  isDark ? "bg-slate-800 text-pink-400 border-pink-500/30 hover:bg-slate-700" : "bg-white text-[#e91e63] border-[#e91e63]/20 shadow-pink-600/20"
                )}
              >
                <Home className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setView("social_media");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/20 hover:scale-105 active:scale-95 transition-all relative"
                title="Redes Sociales"
              >
                <AtSign className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={cn(
                "h-10 w-10 flex items-center justify-center rounded-xl shadow-md border hover:scale-105 active:scale-95 transition-all",
                isDark ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-pink-400" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-[#e91e63]"
              )}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        {view !== "planning" && (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2 w-full">
            <div className={cn(
              "flex-1 flex items-center gap-2 rounded-xl px-3.5 py-2 border transition-all shadow-sm h-10 relative",
              isDark 
                ? "bg-slate-800/80 border-slate-700 focus-within:border-pink-500 focus-within:bg-slate-800" 
                : "bg-slate-50 border-slate-200/80 focus-within:border-pink-300 focus-within:bg-white"
            )}>
              <Search className={cn("h-4 w-4 shrink-0", isDark ? "text-pink-400" : "text-[#e91e63]")} />
              <input
                id="global-search-input"
                type="text"
                placeholder="Busca festival, país o presiona ⌘K..."
                className={cn(
                  "bg-transparent w-full focus:outline-none text-sm font-semibold pr-2",
                  isDark ? "text-slate-100 placeholder:text-slate-400" : "text-slate-800 placeholder:text-slate-500"
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => {
                  if (view !== "festivals") setView("festivals");
                }}
              />
              {onOpenOmnibox && (
                <button
                  type="button"
                  onClick={onOpenOmnibox}
                  className={cn(
                    "hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all shrink-0",
                    isDark ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-slate-200/80 hover:bg-slate-300/80 text-slate-700"
                  )}
                  title="Abrir Búsqueda Omnibox (Ctrl + K)"
                >
                  <span>⌘K</span>
                </button>
              )}
              {search && (
                <button
                  id="btn-clear-search"
                  onClick={() => setSearch("")}
                  className={cn(
                    "p-1 rounded-md transition-colors",
                    isDark ? "text-slate-400 hover:text-pink-400 hover:bg-slate-700" : "text-slate-500 hover:text-[#e91e63] hover:bg-slate-100"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                id="btn-search-options-toggle"
                onClick={() => setShowSearchOptions(!showSearchOptions)}
                className={cn(
                  "p-1 rounded-md transition-colors mr-1",
                  showSearchOptions
                    ? (isDark ? "bg-pink-950/80 text-pink-300" : "bg-pink-100 text-[#e91e63]")
                    : (isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"),
                )}
                title="Opciones de búsqueda"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button
                onClick={() =>
                  setDateFilter(
                    dateFilter === "custom_range" ? "all" : "custom_range",
                  )
                }
                className={cn(
                  "p-1 rounded-md transition-colors",
                  dateFilter === "custom_range"
                    ? (isDark ? "bg-pink-950/80 text-pink-300" : "bg-pink-100 text-[#e91e63]")
                    : (isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"),
                )}
              >
                <CalendarIcon className="h-4 w-4" />
              </button>
            </div>

            <motion.button
              style={{
                width: quickBtnWidth,
                opacity: quickBtnOpacity,
                overflow: "hidden",
              }}
              onClick={() => {
                const targetView =
                  view === "social_media" ? "dashboard" : "social_media";
                setView(targetView);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={cn(
                "h-10 shrink-0 flex items-center justify-center rounded-xl shadow-sm relative hover:scale-105 transition-all border",
                view === "social_media"
                  ? (isDark ? "bg-slate-800 text-pink-400 border-pink-500/30" : "bg-white text-[#e91e63] border-[#e91e63]/20 shadow-pink-600/20")
                  : "bg-sky-500 text-white border-transparent",
              )}
            >
              {view === "social_media" ? (
                <Home className="h-5 w-5 shrink-0" />
              ) : (
                <AtSign className="h-5 w-5 shrink-0" />
              )}
            </motion.button>
            <motion.button
              style={{
                width: quickBtnWidth,
                opacity: quickBtnOpacity,
                overflow: "hidden",
              }}
              onClick={() => setIsSidebarOpen(true)}
              className={cn(
                "h-10 shrink-0 flex items-center justify-center rounded-xl shadow-sm border transition-all hover:scale-105",
                isDark ? "bg-slate-800 text-slate-200 border-slate-700 hover:text-pink-400 hover:bg-slate-700" : "bg-white text-slate-700 border-slate-100 hover:text-[#e91e63] hover:bg-slate-50"
              )}
            >
              <Menu className="h-5 w-5 shrink-0" />
            </motion.button>
          </div>

          <AnimatePresence>
            {showSearchOptions && (
              <motion.div
                key="app-header-search-options"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-3 px-1 pb-3 overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setSearchInObs(!searchInObs)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm justify-start",
                      searchInObs 
                        ? (isDark ? "bg-pink-950/80 border-pink-800 text-pink-300" : "bg-pink-50 border-pink-200 text-[#e91e63]") 
                        : (isDark ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={searchInObs}
                      onChange={() => {}}
                      className="accent-[#e91e63] h-3.5 w-3.5 rounded"
                    />
                    <span>Buscar en Notas</span>
                  </button>
                  <button
                    onClick={() => setOnlyFree(!onlyFree)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm justify-start",
                      onlyFree 
                        ? (isDark ? "bg-pink-950/80 border-pink-800 text-pink-300" : "bg-pink-50 border-pink-200 text-[#e91e63]") 
                        : (isDark ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={onlyFree}
                      onChange={() => {}}
                      className="accent-[#e91e63] h-3.5 w-3.5 rounded"
                    />
                    <span>Sólo Gratis</span>
                  </button>
                  <button
                    onClick={() => setOnlyWithTasks(!onlyWithTasks)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm justify-start",
                      onlyWithTasks 
                        ? (isDark ? "bg-pink-950/80 border-pink-800 text-pink-300" : "bg-pink-50 border-pink-200 text-[#e91e63]") 
                        : (isDark ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={onlyWithTasks}
                      onChange={() => {}}
                      className="accent-[#e91e63] h-3.5 w-3.5 rounded"
                    />
                    <span>Tareas Pendientes</span>
                  </button>
                </div>

                <div className={cn("border-t pt-2.5", isDark ? "border-slate-800" : "border-slate-100")}>
                  <div className="flex items-center justify-between px-1 mb-1.5">
                    <span className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-slate-600")}>
                      Filtrar por País o Países
                    </span>
                    {selectedCountries.length > 0 && (
                      <button
                        onClick={() => setSelectedCountries([])}
                        className={cn("text-xs font-semibold hover:underline", isDark ? "text-pink-400" : "text-[#e91e63]")}
                      >
                        Limpiar Selección ({selectedCountries.length})
                      </button>
                    )}
                  </div>
                  
                  {/* Button to open Country Selection Modal */}
                  <button
                    type="button"
                    onClick={() => setShowCountryModal(true)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]",
                      isDark ? "bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200" : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Globe className={cn("h-3.5 w-3.5 shrink-0", isDark ? "text-slate-400" : "text-slate-500")} />
                      <span className="truncate">
                        {selectedCountries.length === 0
                          ? "Todos los países (Toca para seleccionar)"
                          : selectedCountries.length === 1
                          ? `País: ${selectedCountries[0]}`
                          : `${selectedCountries.length} países seleccionados`}
                      </span>
                    </div>
                    <ChevronDown className={cn("h-3.5 w-3.5", isDark ? "text-slate-400" : "text-slate-500")} />
                  </button>
                </div>
              </motion.div>
            )}
            {dateFilter === "custom_range" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col sm:flex-row gap-2 px-1 pb-2 overflow-hidden"
              >
                <div className={cn("flex-1 p-2 rounded-xl border", isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")}>
                  <label className={cn("text-xs font-semibold block mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    Desde
                  </label>
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className={cn("w-full bg-transparent text-sm outline-none", isDark ? "text-slate-100" : "text-slate-700")}
                  />
                </div>
                <div className={cn("flex-1 p-2 rounded-xl border", isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200")}>
                  <label className={cn("text-xs font-semibold block mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className={cn("w-full bg-transparent text-sm outline-none", isDark ? "text-slate-100" : "text-slate-700")}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}
      </motion.div>
    </motion.header>

    {/* Modal de Selección de Países con alta fidelidad */}
    <AnimatePresence>
      {showCountryModal && (
        <div key="country-modal-container" className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop blur effect */}
          <motion.div
            key="country-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCountryModal(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md pointer-events-auto"
          />
          
          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.35 }}
            className={cn(
              "relative w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[85vh] z-10 pointer-events-auto transition-colors",
              isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-800"
            )}
          >
            {/* Header */}
            <div className={cn("px-6 py-5 border-b flex items-center justify-between", isDark ? "border-slate-800 bg-slate-900/90" : "border-slate-100 bg-slate-50/50")}>
              <div>
                <h3 className={cn("text-sm font-bold", isDark ? "text-slate-100" : "text-slate-800")}>
                  Seleccionar Países
                </h3>
                <p className={cn("text-xs font-medium mt-0.5", isDark ? "text-slate-400" : "text-slate-600")}>
                  {selectedCountries.length === 0
                    ? "Mostrando todos los países"
                    : `${selectedCountries.length} seleccionado${selectedCountries.length > 1 ? "s" : ""}`}
                </p>
              </div>
              <button
                onClick={() => setShowCountryModal(false)}
                className={cn("p-2 rounded-full transition-colors", isDark ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200" : "hover:bg-slate-200/60 text-slate-500 hover:text-slate-800")}
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Search filter within the modal */}
            <div className={cn("px-6 py-4 border-b", isDark ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white")}>
              <div className="relative">
                <Search className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4", isDark ? "text-slate-400" : "text-slate-500")} />
                <input
                  type="text"
                  placeholder="Buscar país por nombre..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-9 py-2.5 border-2 rounded-xl text-xs font-semibold outline-none transition-all",
                    isDark 
                      ? "bg-slate-800 border-slate-700 focus:border-pink-500 focus:bg-slate-800 text-slate-100 placeholder:text-slate-400" 
                      : "bg-slate-50 border-slate-100 focus:border-[#e91e63] focus:bg-white text-slate-800 placeholder:text-slate-500"
                  )}
                />
                {countrySearch && (
                  <button
                    onClick={() => setCountrySearch("")}
                    className={cn("absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full", isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable list of available countries */}
            <div className={cn("flex-1 overflow-y-auto px-6 py-2 divide-y scrollbar-thin", isDark ? "divide-slate-800" : "divide-slate-100")}>
              {(() => {
                const filtered = availableCountries.filter((c) =>
                  c.toLowerCase().includes(countrySearch.toLowerCase())
                );
                if (filtered.length === 0) {
                  return (
                    <div className={cn("text-center py-10 text-xs italic font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
                      No se encontraron países que coincidan
                    </div>
                  );
                }
                return filtered.map((country, idx) => {
                  const isSelected = selectedCountries.includes(country);
                  return (
                    <button
                      key={`${country}-${idx}`}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCountries(selectedCountries.filter((c) => c !== country));
                        } else {
                          setSelectedCountries([...selectedCountries, country]);
                        }
                      }}
                      className={cn(
                        "w-full text-left py-3 text-xs font-semibold transition-colors flex items-center justify-between rounded-lg px-2 -mx-2",
                        isDark 
                          ? "text-slate-200 hover:bg-slate-800 hover:text-pink-400" 
                          : "text-slate-700 hover:bg-pink-50/50 hover:text-[#e91e63]"
                      )}
                    >
                      <span className="truncate">{country}</span>
                      <div className={cn(
                        "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
                        isSelected 
                          ? "bg-[#e91e63] border-[#e91e63] text-white" 
                          : (isDark ? "border-slate-600 bg-slate-800" : "border-slate-300 bg-white")
                      )}>
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3.5]" />}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            {/* Bottom Actions */}
            <div className={cn("px-6 py-4 border-t flex gap-3", isDark ? "border-slate-800 bg-slate-900/90" : "border-slate-100 bg-slate-50/50")}>
              {selectedCountries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCountries([])}
                  className={cn(
                    "flex-1 px-4 py-2.5 border rounded-xl text-xs font-bold transition-colors shadow-sm",
                    isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Limpiar Todo
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowCountryModal(false)}
                className="flex-1 px-4 py-2.5 bg-[#e91e63] text-white rounded-xl text-xs font-bold hover:bg-opacity-95 transition-all shadow-md shadow-pink-100"
              >
                Listo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Modal de Instalación PWA para Móviles */}
    <AnimatePresence>
      {isInstallModalOpen && (
        <div key="pwa-install-modal-container" className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "rounded-3xl p-6 max-w-sm w-full shadow-2xl border relative space-y-5 transition-colors",
              isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-800"
            )}
          >
            <button
              onClick={() => setIsInstallModalOpen(false)}
              className={cn("absolute top-4 right-4 p-1.5 rounded-full transition-colors", isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100")}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className={cn("p-3 rounded-2xl border", isDark ? "bg-pink-950/60 text-pink-400 border-pink-800" : "bg-pink-50 text-[#e91e63] border-pink-100")}>
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className={cn("text-sm font-bold", isDark ? "text-slate-100" : "text-slate-800")}>
                  Festis en tu celular
                </h3>
                <p className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-slate-600")}>
                  Aplicación Móvil Web
                </p>
              </div>
            </div>

            <div className={cn("space-y-3 p-4 rounded-2xl border text-xs leading-relaxed font-medium", isDark ? "bg-slate-800/80 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-700")}>
              <p>
                Instala la aplicación en tu celular para un acceso directo e instantáneo a la gestión de tus festivales como una app nativa.
              </p>
              <div className={cn("text-[11px] space-y-1.5 pt-2 border-t", isDark ? "border-slate-700 text-slate-400" : "border-slate-200/60 text-slate-600")}>
                <p className={cn("font-bold", isDark ? "text-slate-200" : "text-slate-800")}>📌 Pasos para instalar:</p>
                <p>• <strong>Android / Chrome:</strong> Toca el botón <em>"Instalar"</em> abajo o abre el menú de Chrome (⋮) y elige <em>"Instalar aplicación"</em>.</p>
                <p>• <strong>iPhone / Safari:</strong> Toca el botón Compartir (📤) y selecciona <em>"Añadir a la pantalla de inicio"</em>.</p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setIsInstallModalOpen(false)}
                className={cn("flex-1 py-3 border font-bold rounded-xl text-xs transition-all", isDark ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "border-slate-200 hover:bg-slate-50 text-slate-700")}
              >
                Cerrar
              </button>
              <button
                onClick={async () => {
                  if (handleInstallClick) {
                    await handleInstallClick();
                  } else if (deferredPrompt) {
                    deferredPrompt.prompt();
                  }
                  setIsInstallModalOpen(false);
                }}
                className="flex-1 py-3 bg-[#e91e63] hover:bg-[#d81b60] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-pink-500/20 flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" /> Instalar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};
