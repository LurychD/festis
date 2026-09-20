import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { 
  BookOpen, Search, ArrowLeft, Copy, Check, ExternalLink, 
  FileText, Layers, Database, Layout, Server, Code, Terminal, 
  GitPullRequest, History, AlertTriangle, ShieldCheck, Sparkles,
  ChevronRight, ChevronDown, Folder, FolderOpen, Hash, Sun, Moon, Menu, X, Eye, Code2
} from "lucide-react";
import { cn } from "../utils/helpers";
import { APP_VERSION, DOCS_VERSION_NOTICE } from "../version";

// Dynamic import of all raw Markdown files in /docs and project root
const docFiles = ((import.meta as any).glob(
  [
    "/docs/*.md",
    "/README.md",
    "/CONTRIBUTING.md",
    "/CHANGELOG.md"
  ],
  { query: "?raw", import: "default", eager: true }
) || {}) as Record<string, string>;

export interface WikiDocItem {
  id: string;
  path: string;
  title: string;
  category: string;
  description: string;
  icon: any;
  rawContent: string;
}

const DOC_METADATA: Record<string, { title: string; category: string; description: string; icon: any }> = {
  "/README.md": {
    title: "README - Visión General & Inicio Rápido",
    category: "General",
    description: "Guía de inicio, requisitos, comandos npm, arquitectura SPA y stack tecnológico.",
    icon: FileText
  },
  "/docs/ARCHITECTURE.md": {
    title: "ARCHITECTURE - Arquitectura & Estado",
    category: "Arquitectura",
    description: "Estructura completa de archivos, ciclo de vida de ejecución, manejo de estado, bundling y despliegue.",
    icon: Layers
  },
  "/docs/DATA_MODEL.md": {
    title: "DATA_MODEL - Modelo de Datos & Firestore",
    category: "Base de Datos",
    description: "Esquema de entidades TypeScript, enums oficiales, sub-colecciones e historiales.",
    icon: Database
  },
  "/docs/COMPONENTS_GUIDE.md": {
    title: "COMPONENTS_GUIDE - Guía Maestra UI",
    category: "Componentes",
    description: "Índice visual sin viñetas con enlaces directos a cada subsistema de componentes.",
    icon: Layout
  },
  "/docs/COMPONENTS_MAIN_VIEWS.md": {
    title: "COMPONENTS_MAIN_VIEWS - Vistas Principales",
    category: "Componentes",
    description: "Especificación técnica de las 15 vistas principales (FestivalListView, Details, Stats, etc.)",
    icon: Layout
  },
  "/docs/COMPONENTS_MODALS.md": {
    title: "COMPONENTS_MODALS - Modales e Interacciones",
    category: "Componentes",
    description: "Modales de formulario, paleta de comandos Cmd+K, avisos y confirmaciones auditables.",
    icon: Layout
  },
  "/docs/COMPONENTS_MODULES.md": {
    title: "COMPONENTS_MODULES - Dashboard & Social Media",
    category: "Componentes",
    description: "Módulos de Dashboard, simulador de Instagram, agenda de prensa y Google Drive.",
    icon: Layout
  },
  "/docs/COMPONENTS_TOOLS_UTILS.md": {
    title: "COMPONENTS_TOOLS_UTILS - Herramientas & Shaders",
    category: "Componentes",
    description: "Depuradores in-app, auditoría de duplicados, canvas WebGL 3D y componentes utilitarios.",
    icon: Layout
  },
  "/docs/AUTHENTICATION_AND_SECURITY.md": {
    title: "AUTHENTICATION_AND_SECURITY - Autenticación & RBAC",
    category: "Autenticación & Seguridad",
    description: "Flujo de Firebase Auth, persistencia local, bypass para desarrollo y reglas de seguridad de Firestore.",
    icon: Code
  },
  "/docs/STATE_MANAGEMENT_AND_SYNC.md": {
    title: "STATE_MANAGEMENT_AND_SYNC - Estado & Realtime",
    category: "Estado & Sincronización",
    description: "Hooks de sincronización (useFirestoreSyncArray, useFirestoreSyncDoc), caché offline y procesamiento por lotes.",
    icon: Database
  },
  "/docs/PDF_AND_EXPORT_ENGINE.md": {
    title: "PDF_AND_EXPORT_ENGINE - Motor de Exportación PDF/Excel",
    category: "Reportes & Exportaciones",
    description: "Arquitectura cliente para la maquetación vectorial jsPDF, capturas html2canvas y exportación Excel/CSV.",
    icon: FileText
  },
  "/docs/REPORTS_AND_EXPORTS.md": {
    title: "REPORTS_AND_EXPORTS - Informes & Exportaciones",
    category: "Reportes & Exportaciones",
    description: "Generación de informes ejecutivos, dossiers para instituciones reguladoras, balances y exportación PDF/Excel.",
    icon: FileText
  },
  "/docs/SALES_EXPENSES_FINANCE.md": {
    title: "SALES_EXPENSES_FINANCE - Finanzas & Presupuestos",
    category: "Finanzas & Presupuestos",
    description: "Modelos de fees de inscripción, conversión multidivisa, premios en efectivo y cálculo de ROI.",
    icon: FileText
  },
  "/docs/PUSH_NOTIFICATIONS_ENGINE.md": {
    title: "PUSH_NOTIFICATIONS_ENGINE - Motor de Notificaciones FCM",
    category: "Operativa & Notificaciones",
    description: "Notificaciones Web Push con Firebase Cloud Messaging, Service Workers y detección de vencimientos.",
    icon: Server
  },
  "/docs/MEDIA_INSTAGRAM_AI.md": {
    title: "MEDIA_INSTAGRAM_AI - IA Multimodal & Redes Sociales",
    category: "Servicios & IA",
    description: "Análisis de afiches con Gemini API, simulador de Instagram, hashtags y carpetas de Google Drive.",
    icon: Server
  },
  "/docs/KANBAN_TASKS_OPERATIONS.md": {
    title: "KANBAN_TASKS_OPERATIONS - Kanban & Logística",
    category: "Operativa & Notificaciones",
    description: "Tablero Kanban de entregables, logística de copias DCP/ProRes, subtítulos y tareas pre-postulación.",
    icon: Layout
  },
  "/docs/SERVICES_AND_HELPERS.md": {
    title: "SERVICES_AND_HELPERS - Servicios & IA",
    category: "Servicios & IA",
    description: "Ecosistema de modelos LLM (Gemini, Groq, Llama), helpers y exportadores PDF/Excel.",
    icon: Server
  },
  "/docs/API_AND_INTEGRATIONS.md": {
    title: "API_AND_INTEGRATIONS - Secrets & APIs",
    category: "Backend & Secrets",
    description: "Secrets y variables de entorno, seguridad de credenciales, APIs externas (Gemini, Groq, Google Maps) y Express.",
    icon: Code
  },
  "/docs/TESTING_AND_DEPLOYMENT.md": {
    title: "TESTING_AND_DEPLOYMENT - Despliegue & QA",
    category: "Despliegue & QA",
    description: "Herramientas de diagnóstico in-app, linters, compilación CJS cliente/servidor y despliegue en Cloud Run.",
    icon: Terminal
  },
  "/CONTRIBUTING.md": {
    title: "CONTRIBUTING - Guía de Contribución",
    category: "Guías",
    description: "Convenciones de código TypeScript, flujo de trabajo Git y estándares del proyecto.",
    icon: GitPullRequest
  },
  "/CHANGELOG.md": {
    title: "CHANGELOG - Historial de Cambios",
    category: "Histórico",
    description: "Registro histórico de versiones, características implementadas y correcciones.",
    icon: History
  }
};

interface DocsWikiViewProps {
  onBackToApp: () => void;
}

export const DocsWikiView: React.FC<DocsWikiViewProps> = ({ onBackToApp }) => {
  const [selectedDocPath, setSelectedDocPath] = useState<string>("/README.md");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copiedPath, setCopiedPath] = useState<boolean>(false);
  const [copiedContent, setCopiedContent] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [showRawModal, setShowRawModal] = useState<boolean>(false);

  // State for expandable tree categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    General: true,
    Arquitectura: true,
    "Base de Datos": true,
    "Autenticación & Seguridad": true,
    "Estado & Sincronización": true,
    Componentes: true,
    "Reportes & Exportaciones": true,
    "Finanzas & Presupuestos": true,
    "Operativa & Notificaciones": true,
    "Servicios & IA": true,
    "Backend & Secrets": true,
    "Despliegue & QA": true,
    Guías: true,
    Histórico: true
  });

  const toggleCategory = (catName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  // Build reactive array of documents directly from repository .md files
  const docsList: WikiDocItem[] = useMemo(() => {
    const list: WikiDocItem[] = [];

    const priorityPaths = [
      "/README.md",
      "/docs/ARCHITECTURE.md",
      "/docs/DATA_MODEL.md",
      "/docs/COMPONENTS_GUIDE.md",
      "/docs/COMPONENTS_MAIN_VIEWS.md",
      "/docs/COMPONENTS_MODALS.md",
      "/docs/COMPONENTS_MODULES.md",
      "/docs/COMPONENTS_TOOLS_UTILS.md",
      "/docs/SERVICES_AND_HELPERS.md",
      "/docs/API_AND_INTEGRATIONS.md",
      "/docs/TESTING_AND_DEPLOYMENT.md",
      "/CONTRIBUTING.md",
      "/CHANGELOG.md"
    ];

    const allPaths = Array.from(new Set([...priorityPaths, ...Object.keys(docFiles)]));

    for (const path of allPaths) {
      if (!docFiles[path] && !DOC_METADATA[path]) continue;
      const rawContent = docFiles[path] || `# Archivo ${path}\n*Este archivo está disponible en el repositorio.*`;
      const meta = DOC_METADATA[path] || {
        title: path.replace(/^\//, ""),
        category: path.startsWith("/docs/") ? "Documentación" : "General",
        description: `Archivo de documentación ${path}`,
        icon: FileText
      };

      list.push({
        id: path,
        path,
        title: meta.title,
        category: meta.category,
        description: meta.description,
        icon: meta.icon,
        rawContent
      });
    }

    return list;
  }, []);

  // Filter list by search query
  const filteredDocs = useMemo(() => {
    if (!searchTerm.trim()) return docsList;
    const q = searchTerm.toLowerCase();
    return docsList.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        doc.path.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.rawContent.toLowerCase().includes(q)
    );
  }, [docsList, searchTerm]);

  // Active Document
  const currentDoc = useMemo(() => {
    return docsList.find((d) => d.path === selectedDocPath) || docsList[0];
  }, [docsList, selectedDocPath]);

  // Copy helpers
  const handleCopyPath = () => {
    navigator.clipboard.writeText(currentDoc.path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(currentDoc.rawContent);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  // Group docs by category
  const categories = useMemo(() => {
    const cats: Record<string, WikiDocItem[]> = {};
    for (const doc of filteredDocs) {
      if (!cats[doc.category]) cats[doc.category] = [];
      cats[doc.category].push(doc);
    }
    return cats;
  }, [filteredDocs]);

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col font-sans transition-colors duration-200 pb-20 relative selection:bg-purple-500 selection:text-white",
        isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      )}
    >
      {/* Top Header Bar */}
      <header
        className={cn(
          "sticky top-0 z-40 border-b px-4 py-3 flex items-center justify-between shadow-sm backdrop-blur-md transition-colors",
          isDarkMode
            ? "bg-slate-950/90 border-slate-800 text-white"
            : "bg-white/90 border-slate-200 text-slate-900"
        )}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToApp}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border active:scale-95 shadow-sm",
              isDarkMode
                ? "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
            )}
          >
            <ArrowLeft className="h-4 w-4 text-purple-500" />
            <span>Volver a la App</span>
          </button>

          <div className={cn("h-5 w-px hidden sm:block", isDarkMode ? "bg-slate-800" : "bg-slate-200")} />

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-500/20">
              <BookOpen className="h-4 w-4" />
            </div>
            <h1 className="text-base font-black tracking-tight">Documentación</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              v{APP_VERSION}
            </span>
          </div>
        </div>

        {/* Right Action: Language indicator & Mode Switch */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline-block">
            Español (ES)
          </span>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={cn(
              "p-2 rounded-xl border transition-all active:scale-95 flex items-center justify-center",
              isDarkMode
                ? "bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-800"
                : "bg-slate-100 hover:bg-slate-200 text-purple-700 border-slate-300"
            )}
            title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Right Sidebar Drawer & Backdrop Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Backdrop overlay for sidebar when open */}
              <motion.div
                key="wiki-sidebar-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 z-[110] backdrop-blur-xs cursor-pointer"
              />

              {/* Right Sidebar (Collapsible Drawer on Right Side) */}
              <motion.aside
                key="wiki-sidebar-panel"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 220 }}
                className={cn(
                  "w-80 sm:w-96 border-l flex flex-col shrink-0 z-[120] fixed inset-y-0 right-0 pt-4 shadow-2xl",
                  isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                )}
              >
                {/* Search Box & Header */}
                <div className={cn("p-4 border-b space-y-2", isDarkMode ? "border-slate-800" : "border-slate-200")}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-500">
                      Índice de Documentos
                    </span>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1.5 rounded-xl hover:bg-slate-800/40 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700 active:scale-95"
                      title="Cerrar índice"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar en la documentación..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={cn(
                        "w-full pl-9 pr-8 py-2 border rounded-xl text-xs font-medium focus:outline-none transition-all",
                        isDarkMode
                          ? "bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-purple-500"
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-600"
                      )}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-semibold">
                    <span>{filteredDocs.length} documentos</span>
                    <span className="text-purple-500 font-bold">Repositorio .md</span>
                  </div>
                </div>

                {/* Docs List by Category (Tree View with Accordion Collapsible Nodes) */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {Object.keys(categories).map((catName) => {
                    const isExpanded = expandedCategories[catName] !== false;
                    const catDocs = categories[catName];
                    const hasActiveChild = catDocs.some((d) => d.path === selectedDocPath);

                    return (
                      <div key={catName} className="space-y-1">
                        {/* Category Tree Header */}
                        <button
                          onClick={() => toggleCategory(catName)}
                          className={cn(
                            "w-full flex items-center justify-between p-2 rounded-xl transition-all text-left font-bold text-xs group border",
                            hasActiveChild
                              ? "bg-purple-950/20 text-purple-400 border-purple-500/30"
                              : isDarkMode
                              ? "bg-slate-900/60 hover:bg-slate-900 text-slate-300 border-slate-800/60"
                              : "bg-slate-100 hover:bg-slate-200/70 text-slate-800 border-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isExpanded ? (
                              <FolderOpen className="h-4 w-4 text-purple-400 shrink-0" />
                            ) : (
                              <Folder className="h-4 w-4 text-purple-400/70 shrink-0" />
                            )}
                            <span className="truncate uppercase text-[11px] tracking-wider">{catName}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/20">
                              {catDocs.length}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-400 transition-colors" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-400 transition-colors" />
                            )}
                          </div>
                        </button>

                        {/* Nested Document Items in Tree Branch */}
                        {isExpanded && (
                          <div className="pl-3.5 ml-2 border-l-2 border-purple-500/20 space-y-1 pt-1">
                            {catDocs.map((doc) => {
                              const Icon = doc.icon;
                              const isSelected = selectedDocPath === doc.path;
                              return (
                                <button
                                  key={doc.path}
                                  onClick={() => {
                                    setSelectedDocPath(doc.path);
                                    setIsSidebarOpen(false);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className={cn(
                                    "w-full flex items-start gap-2.5 p-2.5 rounded-xl transition-all text-left border group relative",
                                    isSelected
                                      ? isDarkMode
                                        ? "bg-purple-950/50 border-purple-500/60 text-white shadow-md shadow-purple-950/30"
                                        : "bg-purple-50 border-purple-300 text-purple-950 shadow-sm"
                                      : isDarkMode
                                      ? "bg-slate-900/30 border-transparent text-slate-300 hover:bg-slate-900/90 hover:border-slate-800 hover:text-white"
                                      : "bg-white/60 border-transparent text-slate-700 hover:bg-slate-100 hover:border-slate-200 hover:text-slate-900"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "p-1.5 rounded-lg shrink-0 mt-0.5 transition-colors",
                                      isSelected
                                        ? "bg-purple-600 text-white"
                                        : isDarkMode
                                        ? "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200"
                                        : "bg-slate-200 text-slate-600 group-hover:bg-slate-300 group-hover:text-slate-800"
                                    )}
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-xs font-bold truncate">{doc.title}</span>
                                      {isSelected && (
                                        <ChevronRight className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-[10px] opacity-75 line-clamp-1 mt-0.5 leading-tight">
                                      {doc.description}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {filteredDocs.length === 0 && (
                    <div className="p-8 text-center space-y-2">
                      <Search className="h-8 w-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-500">
                        No se encontraron resultados
                      </p>
                    </div>
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Active Document Header Card */}
            <div
              className={cn(
                "p-6 rounded-2xl border shadow-sm space-y-3 transition-colors",
                isDarkMode
                  ? "bg-slate-950 border-slate-800 text-white"
                  : "bg-white border-slate-200 text-slate-900"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  {currentDoc.category}
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Hash className="h-3 w-3 text-purple-400" />
                  {currentDoc.path}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {currentDoc.title}
              </h2>

              <p className="text-xs text-slate-400 leading-relaxed">
                {currentDoc.description}
              </p>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 dark:text-purple-300 text-xs font-semibold mt-3">
                <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                <span>{DOCS_VERSION_NOTICE}</span>
              </div>
            </div>

            {/* Markdown Rendered Card */}
            <div
              className={cn(
                "p-6 sm:p-10 rounded-2xl border shadow-sm transition-colors",
                isDarkMode
                  ? "bg-slate-950 border-slate-800 text-slate-200"
                  : "bg-white border-slate-200 text-slate-800"
              )}
            >
              <div className="prose max-w-none text-sm leading-relaxed">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1
                        className={cn(
                          "text-xl sm:text-2xl font-black border-b pb-3 mb-4 mt-6 first:mt-0 flex items-center gap-2",
                          isDarkMode
                            ? "text-white border-slate-800"
                            : "text-slate-900 border-slate-200"
                        )}
                      >
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2
                        className={cn(
                          "text-lg font-bold border-b pb-2 mb-3 mt-6 flex items-center gap-2",
                          isDarkMode
                            ? "text-slate-100 border-slate-800/60"
                            : "text-slate-800 border-slate-200"
                        )}
                      >
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3
                        className={cn(
                          "text-base font-extrabold mb-2 mt-4",
                          isDarkMode ? "text-purple-300" : "text-purple-700"
                        )}
                      >
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 leading-relaxed font-normal opacity-90">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1.5 mb-4 opacity-90">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1.5 mb-4 opacity-90">{children}</ol>
                    ),
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    code: ({ children, className }) => {
                      const isInline = !className;
                      const langMatch = className ? /language-(\w+)/.exec(className) : null;
                      const lang = langMatch ? langMatch[1] : "";

                      if (isInline) {
                        return (
                          <code
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[12px] font-mono border",
                              isDarkMode
                                ? "bg-slate-900 text-purple-300 border-slate-800"
                                : "bg-purple-50 text-purple-800 border-purple-200"
                            )}
                          >
                            {children}
                          </code>
                        );
                      }
                      return (
                        <div
                          className={cn(
                            "my-5 rounded-2xl overflow-hidden border shadow-md transition-all",
                            isDarkMode
                              ? "border-slate-800 bg-slate-950"
                              : "border-slate-200 bg-slate-900 text-white"
                          )}
                        >
                          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-purple-400">
                              <Code className="h-3.5 w-3.5" />
                              {lang || "code"}
                            </span>
                            <span className="text-slate-500 text-[10px]">Festis Syntax Format</span>
                          </div>
                          <pre className="p-4 sm:p-5 text-xs font-mono text-purple-200 overflow-x-auto leading-relaxed whitespace-pre">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote
                        className={cn(
                          "border-l-4 p-4 rounded-r-xl my-4 italic",
                          isDarkMode
                            ? "border-purple-500 bg-purple-950/20 text-purple-200"
                            : "border-purple-500 bg-purple-50 text-purple-900"
                        )}
                      >
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-6 border rounded-xl shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead
                        className={cn(
                          "border-b font-bold uppercase tracking-wider text-[10px]",
                          isDarkMode
                            ? "bg-slate-900 border-slate-800 text-purple-300"
                            : "bg-slate-100 border-slate-200 text-purple-800"
                        )}
                      >
                        {children}
                      </thead>
                    ),
                    th: ({ children }) => (
                      <th className="p-3 border-r border-slate-800/40 last:border-r-0">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="p-3 border-b border-r border-slate-800/40 last:border-r-0 opacity-90">
                        {children}
                      </td>
                    ),
                    hr: () => (
                      <hr className={cn("my-6", isDarkMode ? "border-slate-800" : "border-slate-200")} />
                    ),
                    a: ({ href, children }) => {
                      // Internal wiki link click interceptor
                      const handleInternalClick = (e: React.MouseEvent) => {
                        if (!href) return;
                        if (href.startsWith("http://") || href.startsWith("https://")) {
                          return; // Allow external links to open in target="_blank"
                        }
                        e.preventDefault();
                        
                        // Resolve target path
                        let targetPath = href;
                        if (!targetPath.startsWith("/")) {
                          targetPath = "/docs/" + targetPath.replace(/^docs\//, "");
                        }
                        // Remove hash fragment for path lookup
                        const [cleanPath] = targetPath.split("#");
                        
                        const matchedDoc = docsList.find(
                          (d) => d.path === cleanPath || d.path.endsWith(cleanPath.replace(/^\//, ""))
                        );
                        if (matchedDoc) {
                          setSelectedDocPath(matchedDoc.path);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      };

                      return (
                        <a
                          href={href}
                          onClick={handleInternalClick}
                          className="text-purple-400 hover:text-purple-300 hover:underline font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          {children}
                        </a>
                      );
                    }
                  }}
                >
                  {currentDoc.rawContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Raw Markdown Modal */}
      {showRawModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={cn(
              "w-full max-w-3xl rounded-2xl border p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col",
              isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            )}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-800">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Code2 className="h-4 w-4 text-purple-500" /> Contenido Raw ({currentDoc.path})
              </h3>
              <button
                onClick={() => setShowRawModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              readOnly
              value={currentDoc.rawContent}
              className={cn(
                "flex-1 w-full p-4 font-mono text-xs rounded-xl border focus:outline-none resize-none leading-relaxed",
                isDarkMode ? "bg-slate-900 border-slate-800 text-purple-200" : "bg-slate-50 border-slate-200 text-slate-800"
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleCopyContent}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md"
              >
                {copiedContent ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedContent ? "Copiado!" : "Copiar Contenido"}</span>
              </button>
              <button
                onClick={() => setShowRawModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM BAR CONTROLS - COLORFUL ICON-ONLY ESSENTIAL ACTIONS */}
      <footer className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
        <div
          className={cn(
            "pointer-events-auto flex items-center gap-3 sm:gap-4 px-6 py-3.5 sm:px-8 sm:py-4 rounded-full shadow-2xl border backdrop-blur-xl transition-all scale-105",
            isDarkMode
              ? "bg-slate-950/95 border-slate-800 shadow-purple-950/50 text-white"
              : "bg-white/95 border-slate-200 shadow-slate-400/40 text-slate-900"
          )}
        >
          {/* Copiar Enlace / Ruta */}
          <button
            onClick={handleCopyPath}
            className={cn(
              "p-3 rounded-full transition-all border group active:scale-90 relative",
              copiedPath
                ? "bg-emerald-600 border-emerald-500 text-white"
                : isDarkMode
                ? "bg-slate-900 hover:bg-slate-800 border-slate-800"
                : "bg-slate-100 hover:bg-slate-200 border-slate-200"
            )}
            title={copiedPath ? "¡Enlace copiado!" : "Copiar enlace del documento"}
          >
            {copiedPath ? (
              <Check className="h-6 w-6 text-white animate-bounce" />
            ) : (
              <Copy className="h-6 w-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Ver / Copiar Vista RAW Markdown */}
          <button
            onClick={() => setShowRawModal(true)}
            className={cn(
              "p-3 rounded-full transition-all border group active:scale-90 relative",
              isDarkMode
                ? "bg-slate-900 hover:bg-slate-800 border-slate-800"
                : "bg-slate-100 hover:bg-slate-200 border-slate-200"
            )}
            title="Ver código RAW Markdown"
          >
            <Code2 className="h-6 w-6 text-purple-400 group-hover:scale-110 transition-transform" />
          </button>

          <div className={cn("h-7 w-px my-auto mx-1", isDarkMode ? "bg-slate-800" : "bg-slate-200")} />

          {/* Toggle de Índice Sidebar */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "p-3.5 rounded-full transition-all border group active:scale-90 shadow-lg relative",
              isSidebarOpen
                ? "bg-pink-600 border-pink-500 text-white ring-4 ring-pink-500/30"
                : "bg-purple-600 hover:bg-purple-500 border-purple-500 text-white"
            )}
            title={isSidebarOpen ? "Cerrar Índice de documentos" : "Abrir Índice de documentos"}
          >
            <Menu className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </footer>
    </div>
  );
};
