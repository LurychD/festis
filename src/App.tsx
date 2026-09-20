import { KeyDuplicatesInspector } from "./components/KeyDuplicatesInspector";
import { HandDrawnHome, HandDrawnList, HandDrawnTasks, HandDrawnCalendar, HandDrawnStats, HandDrawnHelp, HandDrawnPlanning, HandDrawnCompass } from "./components/HandDrawnIcons";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { PaperTexture, HalftoneCmyk, SimplexNoise } from "@paper-design/shaders-react";
import { useFirestoreSyncArray } from "./hooks/useFirestoreSync";
import { useFirestoreSyncDoc } from "./hooks/useFirestoreSyncDoc";
import { useLocalSyncArray } from "./hooks/useLocalSyncArray";
import {
  Plus,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  Info,
  Calendar as CalendarIcon,
  List,
  BarChart3,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  CheckSquare,
  Circle,
  X,
  Download,
  Bell,
  Mail,
  ChevronRight,
  Filter,
  Globe,
  ExternalLink,
  Edit3,
  Users,
  HelpCircle,
  MapPin,
  Lock,
  User,
  PieChart as PieChartIcon,
  Tag,
  DollarSign,
  AlertCircle,
  Video,
  Settings,
  MonitorPlay,
  ClipboardList,
  Building,
  Upload,
  Database,
  Home,
  PenTool,
  Projector,
  Copy,
  Menu,
  FileDown,
  Bug,
  Image,
  LogOut,
  Share2,
  Hash,
  Smartphone,
  AtSign,
  Sparkles,
  Archive,
  ArchiveRestore,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import {
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  differenceInDays,
  isMonday,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import imageCompression from "browser-image-compression";
import { authenticator } from "@otplib/preset-browser";
import { QRCodeSVG } from "qrcode.react";
import { uploadFileToStorage } from "./utils/storageHelpers";
import { FilmDataView } from "./components/FilmDataView";
import { TasksView } from "./components/TasksView";
import { DashboardView } from "./components/DashboardView";
import { FestivalListView } from "./components/FestivalListView";
import { FestivalDetailsView } from "./components/FestivalDetailsView";
import { BugTrackerView } from "./components/BugTracker";
import { ProductionNotes } from "./components/ProductionNotes";
import { CalendarView } from "./components/CalendarView";
import { GlobalModals } from "./components/GlobalModals";
import { OmniboxModal } from "./components/OmniboxModal";
import { validateBackupJSON } from "./utils/backupValidator";
import { useNotificationEngine } from "./hooks/useNotificationEngine";
import { AppSettingsView } from "./components/AppSettingsView";
import { ConfigView } from "./components/ConfigView";
import { AppSplashScreen } from "./components/AppSplashScreen";
import { HelpView } from "./components/HelpView";
import { PlanningView, PlanningViewRef } from "./components/PlanningView";
import { BugsRoadmapView } from "./components/BugsRoadmapView";
import { FirestoreDebugger } from "./components/FirestoreDebugger";
import { useAuth } from "./AuthProvider";
import { DebugConsole } from "./components/DebugConsole";
import { DocsWikiView } from "./components/DocsWikiView";
import { ThemeDesignSystemShowcaseView } from "./components/ThemeDesignSystemShowcaseView";
import { DistributionPlansView } from "./components/DistributionPlansView";
import { DistributionPlanDetailView } from "./components/DistributionPlanDetailView";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy Loaded Heavy Views
import { lazy, Suspense } from "react";
const EasterEggView = lazy(() =>
  import("./components/EasterEgg").then((m) => ({ default: m.EasterEggView })),
);
const PlayZoneView = lazy(() =>
  import("./components/PlayZoneView").then((m) => ({
    default: m.PlayZoneView,
  })),
);
const StatsView = lazy(() =>
  import("./components/StatsView").then((m) => ({ default: m.StatsView })),
);
const ReportsView = lazy(() =>
  import("./components/ReportsView").then((m) => ({ default: m.ReportsView })),
);
const GalleryView = lazy(() =>
  import("./components/GalleryView").then((m) => ({ default: m.GalleryView })),
);
const SocialMediaView = lazy(() =>
  import("./components/social_media/SocialMediaView").then((m) => ({
    default: m.SocialMediaView,
  })),
);
const ArchiveView = lazy(() =>
  import("./components/ArchiveView").then((m) => ({ default: m.ArchiveView })),
);

import { useProject } from "./context/ProjectContext";
import { ProjectsHomeView } from "./components/ProjectsHomeView";
import { LogoutConfirmModal } from "./components/LogoutConfirmModal";

import {
  Festival,
  FestivalStatus,
  StatusHistoryEntry,
  Task,
  AppNote,
  BugTicket,
  RoadmapItem,
  AppMember,
  AuditLog,
  FilmData,
  GalleryItem,
  SocialPost,
  Reminder,
  Platform,
  DistributionInstitution,
  DistributionPlan,
  DistributionPlanStatus,
} from "./types";
import { INITIAL_FESTIVALS, INITIAL_PLATFORMS } from "./utils/seedData";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  cn,
  getStatusColorStyles,
  getStatusIcon,
  parseFestivalDate,
  formatDisplayDate,
  formatDateForInput,
  formatDateTimeForInput,
  isSimilarMatch,
} from "./utils/helpers";

export type Notification = {
  id: string;
  type: "info" | "warning" | "success" | "alert";
  title: string;
  message: string;
  date: string;
  read: boolean;
  festivalId?: string;
};

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
  | "docs"
  | "distribution_plans"
  | "distribution_plan_detail";
const ADMINS: AppMember[] = [
  {
    id: "axeldibarra@gmail.com",
    name: "Axel Ibarra",
    email: "axeldibarra@gmail.com",
    authorizedEmails: ["axeldibarra@gmail.com"],
    role: "dev",
  },
  {
    id: "luciazruocco@gmail.com",
    name: "Lucia Ruocco",
    email: "luciazruocco@gmail.com",
    authorizedEmails: ["luciazruocco@gmail.com", "luciaruocco1313@gmail.com"],
    role: "admin",
  },
  {
    id: "tiziana@example.com",
    name: "Tiziana Martínez",
    email: "tiziana@example.com",
    authorizedEmails: ["tiziana@example.com"],
    role: "admin",
  },
  {
    id: "emanuel@example.com",
    name: "Emanuel Zalazar",
    email: "emanuel@example.com",
    authorizedEmails: ["emanuel@example.com"],
    role: "visitante",
  },
  {
    id: "amy@example.com",
    name: "Amy Gutiérrez Zapico",
    email: "amy@example.com",
    authorizedEmails: ["amy@example.com"],
    role: "visitante",
  },
];

import { AppHeader } from "./components/AppHeader";
import { PlaceAutocomplete } from "./components/PlaceAutocomplete";

import { useShaderParams } from "./hooks/useShaderParams";

export default function App() {
  console.log("APP IS RENDERING.");
  const [view, setViewOriginal] = useState<View>(() => {
    try {
      if (
        window.location.hash.startsWith("#/docs") ||
        window.location.pathname.startsWith("/docs") ||
        window.location.search.includes("view=docs")
      ) {
        return "docs";
      }
    } catch {}
    return "dashboard";
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.startsWith("#/docs")) {
        setViewOriginal("docs");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const [previousView, setPreviousView] = useState<View>(() => {
    try {
      return (sessionStorage.getItem("previous_app_view") as View) || "festivals";
    } catch {
      return "festivals";
    }
  });

  const setView = (newView: View) => {
    if (newView === "details") {
      setViewOriginal((curr) => {
        if (curr !== "details") {
          setPreviousView(curr);
          try {
            sessionStorage.setItem("previous_app_view", curr);
          } catch {}
        }
        return "details";
      });
    } else {
      setViewOriginal(newView);
    }
  };

  useEffect(() => {
    (window as any).__currentView = view;
    if (view === "social_media") {
      document.body.style.backgroundImage =
        "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 25%, #7dd3fc 50%, #bae6fd 75%, #e0f2fe 100%)";
    } else if (view === "play_zone") {
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "black";
    } else if (view === "docs") {
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "#0f172a";
    } else {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundColor = "";
    }
  }, [view]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(10);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [globalTransition, setGlobalTransition] = useState<{
    active: boolean;
    to: View | null;
  }>({ active: false, to: null });

  const handleGlobalTransition = (targetView: View) => {
    setGlobalTransition({ active: true, to: targetView });
    setTimeout(() => {
      setView(targetView);
      setTimeout(() => {
        setGlobalTransition({ active: false, to: null });
      }, 100);
    }, 1500);
  };

  const showToast = (msg: string) => {
    if (!localDevSettings.showToasts) return;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { user, loading, authError, debugLogs, loginWithGoogle, loginAsDirect, logout } = useAuth();
  const userEmail =
    user?.email || localStorage.getItem("userEmail") || "axeldibarra@gmail.com";
  const userName =
    user?.displayName || localStorage.getItem("userName") || "Axel Ibarra";

  const initialUserEasterEggs = useMemo(() => ({
    email: userEmail,
    unlockedEggs: [],
    lastUpdated: ""
  }), [userEmail]);

  const [userEasterEggs, setUserEasterEggs] = useFirestoreSyncDoc<any>(
    `user_easter_eggs/${userEmail}`,
    initialUserEasterEggs,
    { skipFetch: !userEmail }
  );

  // La variable easterEggUnlocked controla la visibilidad temporal de la pestaña "Secret"
  // en la barra de navegación inferior. No persiste entre recargas de la página para evitar
  // saturar la barra de navegación, pero se mantiene activa durante la sesión en la que se desbloquea.
  const [easterEggUnlocked, setEasterEggUnlockedState] = useState(false);

  const setEasterEggUnlocked = (val: boolean) => {
    setEasterEggUnlockedState(val);
    if (val) {
      localStorage.setItem("easterEggUnlocked", "true");
      const currentEggs = userEasterEggs?.unlockedEggs || [];
      if (!currentEggs.includes("cup_3d")) {
        setUserEasterEggs({
          email: userEmail,
          unlockedEggs: [...currentEggs, "cup_3d"],
          lastUpdated: new Date().toISOString()
        }).catch(err => console.error("Error syncing egg to firestore:", err));
      }
    } else {
      localStorage.removeItem("easterEggUnlocked");
    }
  };

  useEffect(() => {
    if (userEasterEggs && userEasterEggs.unlockedEggs) {
      const hasCup = userEasterEggs.unlockedEggs.includes("cup_3d");
      // Al iniciar o sincronizar con Firestore, no activamos automáticamente la pestaña de la barra inferior
      // para que no vuelva a aparecer al reiniciar la app (persistencia temporal de pestaña).
      // Solo guardamos en localStorage para que PlayZone sepa que el modelo 3D de la taza está desbloqueado.
      if (hasCup) {
        localStorage.setItem("easterEggUnlocked", "true");
      }
    }
  }, [userEasterEggs]);

  const [configTab, setConfigTab] = useState<
    "general" | "services" | "members" | "database" | "visuals" | "info" | "desarrollo" | "proyecto"
  >("general");
  const [auditSearchTerm, setAuditSearchTerm] = useState("");
  const [isDebugMode, setIsDebugMode] = useState(false);

  const [members, setMembers] = useFirestoreSyncArray<AppMember>(
    "authmembers",
    ADMINS,
  );

  const [testRole, setTestRole] = useState<
    "dev" | "admin" | "visitante" | "externo" | null
  >(null);

  const currentUser = useMemo(() => {
    return (
      members.find(
        (m) => m.authorizedEmails && m.authorizedEmails.includes(userEmail),
      ) || null
    );
  }, [members, userEmail]);

  const explicitDev = userEmail === "axeldibarra@gmail.com";
  const explicitAdmin =
    userEmail === "luciaruocco1313@gmail.com" ||
    userEmail === "luciazruocco@gmail.com" ||
    userEmail === "tiziana@example.com";

  const realIsDev = currentUser?.role === "dev" || explicitDev;
  const realIsAdmin =
    currentUser?.role === "admin" || realIsDev || explicitAdmin;

  const effectiveRole: any =
    testRole ||
    (realIsDev
      ? "dev"
      : realIsAdmin
        ? "admin"
        : currentUser?.role || "externo");

  const isDev = effectiveRole === "dev";
  const isAdmin = effectiveRole === "admin" || isDev;
  const isAuthorized =
    effectiveRole !== "visitante" && effectiveRole !== "externo";

  const planningRef = useRef<PlanningViewRef>(null);

  const hasBirthdayToday = useMemo(() => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    return members.some((m) => {
      if (!m.birthday) return false;
      const parts = m.birthday.split("-");
      if (parts.length >= 3) {
        const mMonth = parseInt(parts[1], 10);
        const mDay = parseInt(parts[2], 10);
        return mMonth === todayMonth && mDay === todayDay;
      }
      return false;
    });
  }, [members]);

  const [search, setSearch] = useState("");
  const [searchInObs, setSearchInObs] = useState(false);
  const [onlyFree, setOnlyFree] = useState(false);
  const [onlyWithTasks, setOnlyWithTasks] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [taskSearch, setTaskSearch] = useState("");

  const { currentProject, setCurrentProject } = useProject();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Generador dinámico de rutas de subcolección según el proyecto activo
  const subCollectionPath = (sub: string) =>
    currentProject ? `projects/${currentProject.id}/${sub}` : `_disabled_${sub}`;

  const [festivals, setFestivals, isFestivalsLoading] = useFirestoreSyncArray<Festival>(
    subCollectionPath("festivals"),
    [],
    undefined,
    { skipFetch: !isAuthorized || !currentProject },
  );
  const [socialPosts, setSocialPosts] = useFirestoreSyncArray<SocialPost>(
    subCollectionPath("social_posts"),
    [],
    undefined,
    { skipFetch: !isAuthorized || !currentProject },
  );
  const [reminders, setReminders] = useFirestoreSyncArray<Reminder>(
    subCollectionPath("reminders"),
    [],
    undefined,
    { skipFetch: !isAuthorized || !currentProject }
  );

  const addReminder = (r: Omit<Reminder, 'id'>) => setReminders(prev => [...prev, { id: Date.now().toString(), ...r }]);
  const updateReminder = (id: string, updates: Partial<Reminder>) => setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  const deleteReminder = (id: string) => setReminders(prev => prev.filter(r => r.id !== id));
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isOmniboxOpen, setIsOmniboxOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOmniboxOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);
  const [notifications, setNotifications] = useLocalSyncArray<Notification>(
    "notifications",
    [],
  );
  const [auditLogs, setAuditLogs] = useFirestoreSyncArray<AuditLog>(
    subCollectionPath("auditlogs"),
    [],
    { limitCount: 20, sortField: "timestamp", sortDesc: true },
    { skipFetch: !isAuthorized || !currentProject },
  );
  const [notes, setNotes] = useFirestoreSyncArray<AppNote>(
    subCollectionPath("notes"),
    [],
    undefined,
    { skipFetch: !isAuthorized || !currentProject },
  );
  const [bugs, setBugs] = useFirestoreSyncArray<BugTicket>(
    subCollectionPath("bugs"),
    [],
    undefined,
    { skipFetch: !isAuthorized || !currentProject },
  );
  const [roadmap, setRoadmap] = useFirestoreSyncArray<RoadmapItem>(
    subCollectionPath("roadmap"),
    [],
    undefined,
    { skipFetch: !isAuthorized || !currentProject },
  );
  const [filmData, setFilmData] = useFirestoreSyncArray<FilmData>(
    subCollectionPath("film_data"),
    [],
    undefined,
    { skipFetch: !isAuthorized || !currentProject },
  );
  const [gallery, setGallery] = useFirestoreSyncArray<GalleryItem>(
    subCollectionPath("gallery"),
    [],
    undefined,
    { skipFetch: !isAuthorized || !currentProject },
  );
  const [institutions, setInstitutions] = useFirestoreSyncArray<DistributionInstitution>(
    subCollectionPath("institutions"),
    [],
    undefined,
    { skipFetch: !isAuthorized || !currentProject },
  );
  const [distributionPlans, setDistributionPlans, isPlansLoading] = useFirestoreSyncArray<DistributionPlan>(
    subCollectionPath("distribution_plans"),
    [],
    undefined,
    { skipFetch: !isAuthorized || !currentProject },
  );

  // Compuerta de sincronización inicial de catálogo para evitar pantallas vacías o parpadeos
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);

  useEffect(() => {
    if (!isAuthorized || !currentProject) {
      setIsInitialSyncDone(true);
      return;
    }
    // Si ambas colecciones principales completaron su primer fetch de Firestore
    if (!isFestivalsLoading && !isPlansLoading) {
      setIsInitialSyncDone(true);
    }
  }, [isAuthorized, currentProject, isFestivalsLoading, isPlansLoading]);

  // Timeout de seguridad preventivo (máximo 2.8s) para garantizar acceso en cualquier condición de red
  useEffect(() => {
    if (!isAuthorized) return;
    const safetyTimer = setTimeout(() => {
      setIsInitialSyncDone(true);
    }, 2800);
    return () => clearTimeout(safetyTimer);
  }, [isAuthorized]);
  const [selectedDistributionPlanId, setSelectedDistributionPlanId] = useState<string | null>(null);
  const [platforms, setPlatforms] = useFirestoreSyncArray<Platform>(
    "platforms",
    INITIAL_PLATFORMS,
    undefined,
    { skipFetch: !isAuthorized },
  );
  const [isDesaturated, setIsDesaturated] = useState(
    () => localStorage.getItem("isDesaturated") === "true",
  );
  const [usePaperShader, setUsePaperShader] = useState(
    () => {
      const val = localStorage.getItem("usePaperShader");
      return val === null ? false : val === "true";
    }
  );
  const [paperOpacity, setPaperOpacity] = useState(
    () => parseFloat(localStorage.getItem("paperOpacity") || "0.35")
  );
  const [paperBlendMode, setPaperBlendMode] = useState(
    () => (localStorage.getItem("paperBlendMode") as any) || "color-burn"
  );

  const [useCmykShader, setUseCmykShader] = useState(
    () => localStorage.getItem("useCmykShader") === "true"
  );
  const [cmykOpacity, setCmykOpacity] = useState(
    () => parseFloat(localStorage.getItem("cmykOpacity") || "0.3")
  );
  const [cmykBlendMode, setCmykBlendMode] = useState(
    () => (localStorage.getItem("cmykBlendMode") as any) || "multiply"
  );

  const [useGrainShader, setUseGrainShader] = useState(
    () => localStorage.getItem("useGrainShader") === "true"
  );
  const [grainOpacity, setGrainOpacity] = useState(
    () => parseFloat(localStorage.getItem("grainOpacity") || "0.1")
  );
  const [grainBlendMode, setGrainBlendMode] = useState(
    () => (localStorage.getItem("grainBlendMode") as any) || "overlay"
  );

  const { paperParams, updatePaperParam, cmykParams, updateCmykParam, grainParams, updateGrainParam } = useShaderParams();

  const GlobalEffects = () => (
    <>
      {isDesaturated && <div className="fixed inset-0 pointer-events-none z-[9999] backdrop-grayscale" />}
      {usePaperShader && (
        <div className="fixed inset-0 pointer-events-none z-[9998] flex outline-none" style={{ mixBlendMode: paperBlendMode, opacity: paperOpacity }}>
          <PaperTexture {...paperParams} width="100%" height="100%" className="w-full h-full block" />
        </div>
      )}
      {useCmykShader && (
        <div className="fixed inset-0 pointer-events-none z-[9997] flex outline-none" style={{ mixBlendMode: cmykBlendMode, opacity: cmykOpacity }}>
          <HalftoneCmyk {...cmykParams} width="100%" height="100%" className="w-full h-full block" />
        </div>
      )}
      {useGrainShader && (
        <div className="fixed inset-0 pointer-events-none z-[9996] flex outline-none" style={{ mixBlendMode: grainBlendMode, opacity: grainOpacity }}>
          <SimplexNoise {...grainParams} width="100%" height="100%" className="w-full h-full block" />
        </div>
      )}
    </>
  );

  const addAuditLog = (collection: string, details: string) => {
    setAuditLogs((prev) => [
      {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        user: userName,
        collection,
        details,
      },
      ...prev,
    ]);
  };

  useEffect(() => {
    if (user && !sessionStorage.getItem("loginAudited_" + user.uid)) {
      sessionStorage.setItem("loginAudited_" + user.uid, "true");

      const userAgent = navigator.userAgent;
      const platform = navigator.platform || "Desconocido";

      // Intentar obtener IP de forma sencilla
      fetch("https://api.ipify.org?format=json")
        .then((res) => res.json())
        .then((data) => {
          const ip = data.ip;
          addAuditLog(
            "auth",
            `${userName} (${user.email}) inició sesión. IP: ${ip}, MAC: No detectable (Web), VPN: No detectable, Disp: ${platform}, UserAgent: ${userAgent}`,
          );
        })
        .catch(() => {
          addAuditLog(
            "auth",
            `${userName} (${user.email}) inició sesión. Disp: ${platform}, UserAgent: ${userAgent}`,
          );
        });
    }
  }, [user, userName]);

  useEffect(() => {
    if (isDesaturated) {
      document.documentElement.style.setProperty("filter", "grayscale(100%)", "important");
      document.body.style.setProperty("filter", "grayscale(100%)", "important");
    } else {
      document.documentElement.style.removeProperty("filter");
      document.body.style.removeProperty("filter");
    }
  }, [isDesaturated]);

  const addNotification = (
    type: Notification["type"],
    title: string,
    message: string,
    customDate?: string,
    festivalId?: string,
  ) => {
    const newNotif: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      date: customDate || new Date().toISOString(),
      read: false,
    };
    if (festivalId) newNotif.festivalId = festivalId;
    setNotifications((prev) => [newNotif, ...prev]);

    // Disparar notificación nativa del navegador si el permiso está concedido
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const notifOptions = {
          body: message,
          icon: "/images/favicon.png",
          data: {
            festivalId: festivalId,
            url: festivalId ? `/?festivalId=${encodeURIComponent(festivalId)}` : "/",
          },
        };

        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, notifOptions);
          }).catch(() => {
            const fallbackNotif = new Notification(title, notifOptions);
            fallbackNotif.onclick = () => {
              window.focus();
              if (festivalId && festivals && festivals.length > 0) {
                const found = festivals.find((f) => f.id === festivalId);
                if (found) {
                  setSelectedFestival(found);
                  setView("details");
                }
              }
            };
          });
        } else {
          const fallbackNotif = new Notification(title, notifOptions);
          fallbackNotif.onclick = () => {
            window.focus();
            if (festivalId && festivals && festivals.length > 0) {
              const found = festivals.find((f) => f.id === festivalId);
              if (found) {
                setSelectedFestival(found);
                setView("details");
              }
            }
          };
        }
      } catch (e) {
        console.warn("No se pudo enviar notificación nativa:", e);
      }
    }
  };

  // Escuchar mensajes del Service Worker cuando el usuario hace clic en una notificación
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "NOTIFICATION_CLICK") {
        const { festivalId: targetId, view: targetView } = event.data;
        if (targetId && festivals && festivals.length > 0) {
          const found = festivals.find((f) => f.id === targetId);
          if (found) {
            setSelectedFestival(found);
            setView("details");
          }
        } else if (targetView) {
          setView(targetView as any);
        }
      }
    };

    navigator.serviceWorker.addEventListener("message", handleSwMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleSwMessage);
    };
  }, [festivals]);

  // Manejar apertura directa desde URL con deep link (ej: /?festivalId=123 o /?view=calendar)
  useEffect(() => {
    if (!festivals || festivals.length === 0) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const paramFestId = params.get("festivalId") || params.get("fId");
      const paramView = params.get("view") || params.get("tab");

      if (paramFestId) {
        const found = festivals.find((f) => f.id === paramFestId);
        if (found) {
          setSelectedFestival(found);
          setView("details");
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, "", cleanUrl);
        }
      } else if (paramView) {
        setView(paramView as any);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, "", cleanUrl);
      }
    } catch (e) {
      console.warn("Error leyendo query params de notificaciones:", e);
    }
  }, [festivals]);

  // Usar el Hook extraído del motor de notificaciones y purgado de almacenamiento
  useNotificationEngine({
    festivals,
    reminders,
    addNotification,
  });

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit" | "new_edition">("create");

  const [dateFilter, setDateFilter] = useState<string>("all");
  const [dateRangeStart, setDateRangeStart] = useState<string>("");
  const [dateRangeEnd, setDateRangeEnd] = useState<string>("");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(
    new Date(),
  );

  useEffect(() => {
    setDisplayedCount(10);
  }, [search, filterStatus, dateFilter, view, searchInObs, onlyFree, onlyWithTasks, selectedCountries]);

  const availableCountries = useMemo(() => {
    const countries = festivals
      .filter((f) => !f.archived && f.country)
      .map((f) => {
        const parts = f.country.split(",");
        const c = parts[parts.length - 1].trim();
        return c;
      })
      .filter(Boolean);
    return Array.from(new Set(countries)).sort();
  }, [festivals]);

  const [devSettings, setDevSettings] = useFirestoreSyncDoc<any>(
    "config/developer",
    {
      twoFactorSecret: "",
    },
    { skipFetch: !isAdmin },
  );

  // Persistence
  useEffect(() => {
    localStorage.setItem("festivals", JSON.stringify(festivals));
  }, [festivals]);

  useEffect(() => {
    localStorage.setItem("authmembers", JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("bugs", JSON.stringify(bugs));
  }, [bugs]);

  useEffect(() => {
    localStorage.setItem("roadmap", JSON.stringify(roadmap));
  }, [roadmap]);

  // Filters
  const activeFestivals = useMemo(() => festivals.filter((f) => !f.archived), [festivals]);

  const filteredFestivals = useMemo(() => {
    const result = activeFestivals.filter((f) => {
      const matchesSearch =
        isSimilarMatch(f.name, search) ||
        isSimilarMatch(f.country, search) ||
        (searchInObs && (
          isSimilarMatch(f.observations, search) ||
          isSimilarMatch(f.category, search) ||
          isSimilarMatch(f.platform, search) ||
          isSimilarMatch(f.projectionLocation, search)
        ));
      const matchesStatus = filterStatus === "all" || f.status === filterStatus;

      let matchesDate = true;
      if (dateFilter === "closing_soon") {
        if (!f.deadline) return false;
        const d = parseFestivalDate(f.deadline);
        if (!d) return false;
        const soon = new Date();
        soon.setDate(soon.getDate() + 30);
        matchesDate = isAfter(d, new Date()) && !isAfter(d, soon);
      } else if (dateFilter === "custom_range") {
        if (!f.deadline) return false;
        const d = parseFestivalDate(f.deadline);
        if (!d) return false;

        if (dateRangeStart) {
          const startD = parseISO(dateRangeStart);
          if (isBefore(d, startD) && !isSameDay(d, startD)) matchesDate = false;
        }
        if (dateRangeEnd) {
          const endD = parseISO(dateRangeEnd);
          if (isAfter(d, endD) && !isSameDay(d, endD)) matchesDate = false;
        }
      }

      const matchesFree = !onlyFree || (
        (f.price || "").toLowerCase().includes("gratis") ||
        (f.price || "").toLowerCase().includes("free") ||
        (f.price || "") === "0" ||
        (f.price || "") === ""
      );

      const matchesTasks = !onlyWithTasks || (f.tasks && f.tasks.some(t => !t.completed));

      const matchesCountry = selectedCountries.length === 0 || selectedCountries.some(c => {
        const countryLower = c.toLowerCase();
        return (f.country || "").toLowerCase().includes(countryLower);
      });

      return matchesSearch && matchesStatus && matchesDate && matchesFree && matchesTasks && matchesCountry;
    });

    // Exact sorting requirement
    const statusOrderArray = [
      FestivalStatus.POR_ENVIAR,
      FestivalStatus.PROXIMAMENTE,
      FestivalStatus.EN_REVISION,
      FestivalStatus.EN_DUDA,
      FestivalStatus.SELECCIONADO,
      FestivalStatus.PROYECTADO,
      FestivalStatus.GANADO,
      FestivalStatus.NO_SELECCIONADO,
      FestivalStatus.DESCALIFICADO,
      FestivalStatus.CERRADO,
    ];

    return result.sort((a, b) => {
      const idxA = statusOrderArray.indexOf(a.status);
      const idxB = statusOrderArray.indexOf(b.status);
      const orderA = idxA === -1 ? 999 : idxA;
      const orderB = idxB === -1 ? 999 : idxB;
      return orderA - orderB;
    });
  }, [festivals, search, filterStatus, dateFilter, searchInObs, onlyFree, onlyWithTasks, selectedCountries]);

  // Statistics
  const statsData = useMemo(() => {
    const statusCounts = festivals.reduce(
      (acc, f) => {
        acc[f.status] = (acc[f.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [festivals]);

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#64748b",
  ];

  const renderDebugFAB = () => {
    if (!isDebugMode) return null;
    return (
      <div className="group relative flex flex-col items-center pointer-events-auto">
        <button
          id="btn-auto-1"
          onClick={(e) => {
            e.stopPropagation();
            setFestivals((prev) =>
              prev.filter((f) => !f.name.startsWith("TEST-FESTI-")),
            );
            showAlert("TEST-FESTIs eliminados");
          }}
          className="absolute -top-12 opacity-0 group-hover:opacity-100 h-10 w-10 rounded-full bg-red-500 shadow-2xl flex items-center justify-center text-white active:scale-90 transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          id="btn-auto-2"
          onClick={() => {
            const epoch = Date.now();
            const testFests: Festival[] = Object.values(FestivalStatus).map(
              (status, i) => ({
                id: (epoch + i).toString(),
                name: `TEST-FESTI-${status.replace(/\s/g, "-").toUpperCase()}`,
                type: "Cortometraje",
                country: "Pais Test",
                category: "Ficción",
                price: "15 USD",
                deadline: "2026-12-31",
                status: status,
                link: "https://filmfreeway.com",
                newsDate: "2026-06-01",
                nomination: "Mejor Corto test",
                projectionDate: "2026-07-01",
                projectionLocation: "Cine Test",
                observations: `Este es un festival de prueba para el estado ${status}`,
                tasks: [
                  {
                    id: `t1-${epoch + i}`,
                    title: "Subir subtítulos test",
                    completed: false,
                  },
                ],
              }),
            );
            setFestivals((prev) => [...testFests, ...prev]);
            showAlert("Agregados 9 TEST-FESTI");
          }}
          className="h-16 w-16 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 shadow-2xl shadow-blue-500/40 flex items-center justify-center text-white active:scale-90 transition-all hover:scale-105"
        >
          <Plus className="h-8 w-8 stroke-[3px]" />
        </button>
      </div>
    );
  };

  // Exports
  // Migrations
  const isMigratingRef = useRef(false);
  const migrateOldCollection = async (collectionName: string) => {
    if (isMigratingRef.current) return;
    isMigratingRef.current = true;
    try {
      showToast(
        `Conectando a base de datos anterior para migrar ${collectionName}...`,
      );
      const { collection, getDocs, doc, getDoc, getFirestore } =
        await import("firebase/firestore");
      const { initializeApp, getApps } = await import("firebase/app");
      const { getAuth, signInWithPopup, GoogleAuthProvider } =
        await import("firebase/auth");

      const oldConfig = {
        projectId: "gen-lang-client-0341676723",
        appId: "1:938854403958:web:8f2f406042bf675420b457",
        apiKey: "AIzaSyCGdJEDytgNuk3_AoOyh_4KvI7_WGJQJ_c",
        authDomain: "gen-lang-client-0341676723.firebaseapp.com",
        storageBucket: "gen-lang-client-0341676723.firebasestorage.app",
      };

      const existingApps = getApps();
      const oldApp =
        existingApps.find((app) => app.name === "oldAppExport") ||
        initializeApp(oldConfig, "oldAppExport");

      const oldAuth = getAuth(oldApp);
      if (!oldAuth.currentUser) {
        showToast(
          "Iniciando sesión segura en la base de datos antigua por única vez...",
        );
        const provider = new GoogleAuthProvider();
        await signInWithPopup(oldAuth, provider);
      }

      const oldDb = getFirestore(
        oldApp,
        "ai-studio-1b81e3cf-4528-4366-99fc-fa6a94e45f5b",
      );

      let actualCollectionPath = collectionName;
      if (collectionName === "members") actualCollectionPath = "authmembers";
      if (collectionName === "filmData")
        actualCollectionPath = "filmData_Cardigan";

      showToast(
        `Descargando ${collectionName} desde la base de datos de ai-studio...`,
      );
      const snap = await getDocs(collection(oldDb, actualCollectionPath));
      let data: any[] = [];
      snap.forEach((d) => {
        let docData: any = { ...d.data(), id: d.id };
        // Fix for 1500 bytes indexed string limit usually caused by large base64 fields like laurel
        if (collectionName === "festivals" && docData.laurel) {
          delete docData.laurel;
        }
        data.push(docData);
      });

      if (data.length === 0) {
        showAlert(`No se encontraron datos en la colección ${collectionName}.`);
        return;
      }

      showToast(
        `Sincronizando ${data.length} elementos de ${collectionName} a la nueva DB...`,
      );

      if (collectionName === "festivals") await setFestivals(data);
      if (collectionName === "members") await setMembers(data);
      if (collectionName === "auditlogs") await setAuditLogs(data);
      if (collectionName === "notes") await setNotes(data);
      if (collectionName === "bugs") await setBugs(data);
      if (collectionName === "roadmap") await setRoadmap(data);
      if (collectionName === "filmData") await setFilmData(data);

      addAuditLog(
        "bd",
        `${userName} migró la colección ${collectionName} de forma directa.`,
      );
      showAlert(
        `Migración completada`,
        `Colección ${collectionName} migrada con éxito.`,
      );
    } catch (err: any) {
      console.error(err);
      showAlert(
        `Error migrando colección ${collectionName}`,
        err.message || String(err),
      );
    } finally {
      isMigratingRef.current = false;
    }
  };

  const exportDB = async () => {
    const exportData = {
      version: 2,
      festivals,
      members,
      notifications,
      auditLogs,
      notes,
      bugs,
      roadmap,
      filmData,
      socialPosts,
      reminders,
      gallery,
      distributionPlans,
      institutions,
      platforms,
    };

    addAuditLog("bd", `${userName} ha exportado la base de datos completa.`);

    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    zip.file("festis_db_full.json", JSON.stringify(exportData, null, 2));

    // Add collections separately
    zip.file("festivals.json", JSON.stringify(festivals, null, 2));
    zip.file("members.json", JSON.stringify(members, null, 2));
    zip.file("notifications.json", JSON.stringify(notifications, null, 2));
    zip.file("auditLogs.json", JSON.stringify(auditLogs, null, 2));
    zip.file("notes.json", JSON.stringify(notes, null, 2));
    zip.file("bugs.json", JSON.stringify(bugs, null, 2));
    zip.file("roadmap.json", JSON.stringify(roadmap, null, 2));
    zip.file("filmData.json", JSON.stringify(filmData, null, 2));
    zip.file("socialPosts.json", JSON.stringify(socialPosts, null, 2));
    zip.file("reminders.json", JSON.stringify(reminders, null, 2));
    zip.file("gallery.json", JSON.stringify(gallery, null, 2));
    zip.file("distributionPlans.json", JSON.stringify(distributionPlans, null, 2));
    zip.file("institutions.json", JSON.stringify(institutions, null, 2));
    zip.file("platforms.json", JSON.stringify(platforms, null, 2));

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `festis_backup_${format(new Date(), "yyyyMMdd_HHmm")}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportDBExcel = async () => {
    addAuditLog("bd", `${userName} ha exportado la base de datos a Excel.`);

    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const festWS = XLSX.utils.json_to_sheet(
      festivals.map((f) => {
        const clone = { ...f };
        if (clone.tasks) clone.tasks = JSON.stringify(clone.tasks) as any;
        if (clone.statusHistory) {
          clone.statusHistory = clone.statusHistory
            .map(
              (h) =>
                `${h.status}${h.timestamp ? ` (${h.timestamp.split("T")[0]})` : ""}${h.note ? ` [${h.note}]` : ""}`
            )
            .join(" → ") as any;
        }
        return clone;
      }),
    );
    XLSX.utils.book_append_sheet(wb, festWS, "Festivals");

    const memWS = XLSX.utils.json_to_sheet(
      members.map((m) => {
        const clone = { ...m };
        if (clone.authorizedEmails)
          clone.authorizedEmails = clone.authorizedEmails.join(", ") as any;
        return clone;
      }),
    );
    XLSX.utils.book_append_sheet(wb, memWS, "Members");

    const notifWS = XLSX.utils.json_to_sheet(notifications);
    XLSX.utils.book_append_sheet(wb, notifWS, "Notifications");

    const auditWS = XLSX.utils.json_to_sheet(auditLogs);
    XLSX.utils.book_append_sheet(wb, auditWS, "AuditLogs");

    const rootWS = XLSX.utils.json_to_sheet(roadmap);
    XLSX.utils.book_append_sheet(wb, rootWS, "Roadmap");

    const bugsWS = XLSX.utils.json_to_sheet(bugs);
    XLSX.utils.book_append_sheet(wb, bugsWS, "Bugs");

    const notesWS = XLSX.utils.json_to_sheet(notes);
    XLSX.utils.book_append_sheet(wb, notesWS, "Notes");

    const filmWS = XLSX.utils.json_to_sheet(filmData);
    XLSX.utils.book_append_sheet(wb, filmWS, "FilmData");

    const socialWS = XLSX.utils.json_to_sheet(socialPosts);
    XLSX.utils.book_append_sheet(wb, socialWS, "SocialPosts");

    const remindersWS = XLSX.utils.json_to_sheet(reminders);
    XLSX.utils.book_append_sheet(wb, remindersWS, "Reminders");

    const galleryWS = XLSX.utils.json_to_sheet(gallery);
    XLSX.utils.book_append_sheet(wb, galleryWS, "Gallery");

    const plansWS = XLSX.utils.json_to_sheet(
      distributionPlans.map((p) => {
        const clone = { ...p };
        if (clone.festivalesBorrador) {
          clone.festivalesBorrador = JSON.stringify(clone.festivalesBorrador) as any;
        }
        return clone;
      }),
    );
    XLSX.utils.book_append_sheet(wb, plansWS, "DistributionPlans");

    const instWS = XLSX.utils.json_to_sheet(institutions);
    XLSX.utils.book_append_sheet(wb, instWS, "Institutions");

    const platWS = XLSX.utils.json_to_sheet(platforms);
    XLSX.utils.book_append_sheet(wb, platWS, "Platforms");

    XLSX.writeFile(
      wb,
      `festis_db_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`,
    );
  };

  const downloadCollection = (collectionName: string, data: any) => {
    addAuditLog(
      "bd",
      `${userName} ha exportado la colección '${collectionName}'.`,
    );
    const exportData = {
      version: 2,
      [collectionName]: data,
    };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute(
      "download",
      `festis_${collectionName}_${format(new Date(), "yyyyMMdd_HHmm")}.json`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const importDB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith(".zip")) {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);

        let targetFile = loadedZip.file("festis_db_full.json") || loadedZip.file("cardigan_db_full.json");
        if (!targetFile) {
          // If the zip was packed differently, find the first JSON file
          const files = Object.keys(loadedZip.files);
          const firstJson = files.find((f) => f.endsWith(".json"));
          if (firstJson) {
            targetFile = loadedZip.file(firstJson);
          }
        }

        if (targetFile) {
          const content = await targetFile.async("string");
          const data = JSON.parse(content);
          await handleImportData(data);
        } else {
          showAlert("El archivo ZIP no contiene ningún archivo JSON válido.");
        }
      } else {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            await handleImportData(data);
          } catch (error) {
            console.error("Error parsing JSON:", error);
            showAlert("Error al leer la base de datos.", String(error));
          }
        };
        reader.readAsText(file);
      }
    } catch (error: any) {
      console.error("Error opening import file:", error);
      showAlert(
        "Error procesando el archivo de importación.",
        error?.message || String(error),
      );
    }

    e.target.value = "";
  };

  const handleImportData = async (data: any) => {
    try {
      const validation = validateBackupJSON(data);
      if (!validation.isValid) {
        showAlert("Error de validación de Backup:", validation.error || "Estructura JSON no válida.");
        return;
      }

      const cleanData = validation.sanitizedData;

      if (Array.isArray(cleanData)) {
        await setFestivals(cleanData);
        showAlert(`Sincronización exitosa. Se han importado ${cleanData.length} festivales validados.`);
        addAuditLog("bd", `${userName} ha importado la base de datos de ${cleanData.length} festivales.`);
      } else {
        if (cleanData.festivals) await setFestivals(cleanData.festivals);
        if (cleanData.members) await setMembers(cleanData.members);
        if (cleanData.notifications) await setNotifications(cleanData.notifications);
        if (cleanData.auditLogs) await setAuditLogs(cleanData.auditLogs);
        if (cleanData.notes) await setNotes(cleanData.notes);
        if (cleanData.bugs) await setBugs(cleanData.bugs);
        if (cleanData.roadmap) await setRoadmap(cleanData.roadmap);
        if (cleanData.filmData) await setFilmData(cleanData.filmData);
        if (cleanData.socialPosts) await setSocialPosts(cleanData.socialPosts);
        if (cleanData.reminders) await setReminders(cleanData.reminders);
        if (cleanData.gallery) await setGallery(cleanData.gallery);

        if (cleanData.distributionPlans) await setDistributionPlans(cleanData.distributionPlans);
        if (cleanData.institutions) await setInstitutions(cleanData.institutions);
        if (cleanData.platforms) await setPlatforms(cleanData.platforms);

        const summary = validation.summary;
        showAlert(
          `Sincronización exitosa y verificada. Módulos restaurados: ${summary?.modulesDetected.join(", ") || "OK"}`
        );
        addAuditLog("bd", `${userName} ha restaurado una copia de seguridad verificada.`);
      }
    } catch (err: any) {
      console.error("Error applying import data:", err);
      showAlert("Error aplicando cambios a Firebase:", err?.message || String(err));
    }
  };

  const exportCSV = () => {
    const headers = [
      "Nombre",
      "País",
      "Estado",
      "Fecha Cierre",
      "Categoría",
      "Link",
      "Es Pineado",
      "Nota del Pin",
    ];
    const rows = festivals.map((f) => [
      f.name,
      f.country,
      f.status,
      f.deadline || "",
      f.category || "",
      f.link || "",
      f.isPinned ? "Sí" : "No",
      f.pinNote || "",
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `festivales_stats_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async (options?: any) => {
    try {
      const { exportPDF } = await import("./utils/pdfExport");
      await exportPDF(festivals, userName, options);
      addAuditLog(
        "informes",
        `${userName} ha descargado el informe PDF de los festivales.`,
      );
    } catch (error) {
      console.error("Error exporting PDF:", error);
      showAlert("Hubo un error al exportar el informe.");
    }
  };

  const handleExportProjectionsPDF = async () => {
    try {
      const { exportProjectionsPDF } = await import("./utils/projectionsPdfExport");
      await exportProjectionsPDF(festivals, userName);
      addAuditLog(
        "informes",
        `${userName} ha descargado el informe PDF de las proyecciones.`,
      );
    } catch (error) {
      console.error("Error exporting PDF:", error);
      showAlert("Hubo un error al exportar el informe de proyecciones.");
    }
  };

  const handleExportAuditPDF = async () => {
    try {
      const { exportAuditPDF } = await import("./utils/auditPdfExport");
      await exportAuditPDF(auditLogs, userName);
      addAuditLog(
        "informes",
        `${userName} ha descargado el informe PDF de auditoría.`,
      );
    } catch (error) {
      console.error("Error exporting Audit PDF:", error);
      showAlert("Hubo un error al exportar el informe de auditoría.");
    }
  };

  const handleExportLaurelsPDF = async () => {
    try {
      const { exportLaurelsPDF } = await import("./utils/laurelsPdfExport");
      await exportLaurelsPDF(festivals, userName);
      addAuditLog(
        "informes",
        `${userName} ha descargado el informe PDF de laureles y selecciones.`,
      );
    } catch (error) {
      console.error("Error exporting Laurels PDF:", error);
      showAlert("Hubo un error al exportar el informe de laureles.");
    }
  };

  const handleExportStatsPDF = async () => {
    try {
      const { exportStatsPDF } = await import("./utils/statsPdfExport");
      await exportStatsPDF(festivals, userName);
      addAuditLog(
        "informes",
        `${userName} ha descargado el informe PDF de estadísticas y rendimiento.`,
      );
    } catch (error) {
      console.error("Error exporting Stats PDF:", error);
      showAlert("Hubo un error al exportar el informe de estadísticas.");
    }
  };

  const syncWithExcel = () => {
    if (!isAuthorized) {
      showAlert("No tienes permisos para realizar esta acción.");
      return;
    }
    const existingNames = new Set(
      festivals.map((f) => f.name.toLowerCase().trim()),
    );
    const newFestivals = INITIAL_FESTIVALS.filter(
      (f) => !existingNames.has(f.name.toLowerCase().trim()),
    );

    if (newFestivals.length === 0) {
      showAlert("¡Ya tienes todos los festivales del Excel importados!");
      return;
    }

    const updatedList = [...festivals, ...newFestivals];
    setFestivals(updatedList);
    showAlert(
      `Se han importado ${newFestivals.length} festivales nuevos desde el Excel.`,
    );
  };

  const handleAddNote = (title: string, content: string) => {
    setNotes((prev) => [
      {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title,
        content,
        date: new Date().toISOString(),
        author: userName,
      },
      ...prev,
    ]);
  };

  const handleUpdatePin = (
    festivalId: string,
    isPinned: boolean,
    pinNote?: string,
  ) => {
    setFestivals((prev) =>
      prev.map((f) => (f.id === festivalId ? { ...f, isPinned, pinNote } : f)),
    );
    if (selectedFestival?.id === festivalId) {
      setSelectedFestival((prev) =>
        prev ? { ...prev, isPinned, pinNote } : null,
      );
    }
  };

  const handleArchiveFestival = (festivalId: string, archive: boolean) => {
    setFestivals((prev) =>
      prev.map((f) => (f.id === festivalId ? { ...f, archived: archive } : f)),
    );
    if (selectedFestival?.id === festivalId) {
      setSelectedFestival((prev) =>
        prev ? { ...prev, archived: archive } : null,
      );
    }
  };

  const handleUpdateObservations = (festivalId: string, obs: string) => {
    setFestivals((prev) =>
      prev.map((f) => (f.id === festivalId ? { ...f, observations: obs } : f)),
    );
    if (selectedFestival?.id === festivalId) {
      setSelectedFestival((prev) =>
        prev ? { ...prev, observations: obs } : null,
      );
    }
  };

  const handleUpdateStatus = (id: string, newStatus: FestivalStatus, note?: string, customDate?: string) => {
    if (!isAuthorized) {
      showAlert("No tienes permisos para realizar esta acción.");
      return;
    }
    const fest = festivals.find((f) => f.id === id) || (selectedFestival?.id === id ? selectedFestival : undefined);
    if (fest && fest.status !== newStatus) {
      addAuditLog(
        "festivals",
        `${userName} ha cambiado el estado de '${fest.name}' a ${newStatus}.${note ? ` Nota: ${note}` : ''}`,
      );

      let historyTimestamp = new Date().toISOString();
      if (customDate) {
        const parsedCustom = new Date(customDate);
        if (!isNaN(parsedCustom.getTime())) {
          historyTimestamp = parsedCustom.toISOString();
        }
      }

      const newHistoryEntry: StatusHistoryEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        status: newStatus,
        previousStatus: fest.status,
        timestamp: historyTimestamp,
        updatedBy: userName,
        note: note || "Cambio de estado",
      };

      const updatedHistory = [...(fest.statusHistory || []), newHistoryEntry];
      const updatedFest = { ...fest, status: newStatus, statusHistory: updatedHistory };

      setFestivals((prev) =>
        prev.map((f) =>
          f.id === id
            ? updatedFest
            : f
        )
      );

      if (fest.esBorradorPlan && fest.distributionPlanId) {
        setDistributionPlans((prev) =>
          prev.map((plan) =>
            plan.id === fest.distributionPlanId
              ? {
                  ...plan,
                  festivalesBorrador: (plan.festivalesBorrador || []).map((fb) =>
                    fb.id === id ? updatedFest : fb
                  ),
                }
              : plan
          )
        );
      }

      if (selectedFestival?.id === id) {
        setSelectedFestival(updatedFest);
      }
    }
  };

  const syncDraftFestivalTasks = (festivalId: string, getNewTasks: (curr: Task[]) => Task[]) => {
    if (selectedFestival?.id === festivalId && selectedFestival.esBorradorPlan && selectedFestival.distributionPlanId) {
      const updatedTasks = getNewTasks(selectedFestival.tasks || []);
      setDistributionPlans((prev) =>
        prev.map((plan) =>
          plan.id === selectedFestival.distributionPlanId
            ? {
                ...plan,
                festivalesBorrador: (plan.festivalesBorrador || []).map((fb) =>
                  fb.id === festivalId ? { ...fb, tasks: updatedTasks } : fb
                ),
              }
            : plan
        )
      );
    }
  };

  const handleAddTask = (festivalId: string, title: string) => {
    if (!isAuthorized) {
      showAlert("No tienes permisos para realizar esta acción.");
      return;
    }
    const newTask: Task = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title,
      completed: false,
    };

    const fest = festivals.find((f) => f.id === festivalId) || (selectedFestival?.id === festivalId ? selectedFestival : undefined);
    if (fest) {
      addAuditLog(
        "tasks",
        `${userName} ha añadido la tarea '${title}' al festival '${fest.name}'.`,
      );
    }

    setFestivals((prev) => {
      const newFests = prev.map((f) => {
        if (f.id === festivalId) {
          return { ...f, tasks: [...(f.tasks || []), newTask] };
        }
        return f;
      });
      return newFests;
    });

    syncDraftFestivalTasks(festivalId, (curr) => [...curr, newTask]);

    if (selectedFestival?.id === festivalId) {
      setSelectedFestival((prev) =>
        prev ? { ...prev, tasks: [...(prev.tasks || []), newTask] } : null,
      );
    }
  };

  const handleDeleteTask = (festivalId: string, taskId: string) => {
    if (!isAuthorized) {
      showAlert("No tienes permisos.");
      return;
    }
    const fest = festivals.find((f) => f.id === festivalId) || (selectedFestival?.id === festivalId ? selectedFestival : undefined);
    const task = (fest?.tasks || []).find((t) => t.id === taskId);
    if (fest && task) {
      addAuditLog(
        "tasks",
        `${userName} ha borrado la tarea '${task.title}' del festival '${fest.name}'.`,
      );
    }

    setFestivals((prev) =>
      prev.map((f) => {
        if (f.id === festivalId) {
          return {
            ...f,
            tasks: (f.tasks || []).filter((t) => t.id !== taskId),
          };
        }
        return f;
      }),
    );

    syncDraftFestivalTasks(festivalId, (curr) => curr.filter((t) => t.id !== taskId));

    if (selectedFestival?.id === festivalId) {
      setSelectedFestival((prev) =>
        prev
          ? {
              ...prev,
              tasks: (prev.tasks || []).filter((t) => t.id !== taskId),
            }
          : null,
      );
    }
  };

  const handleEditTask = (
    festivalId: string,
    taskId: string,
    newTitle: string,
  ) => {
    if (!isAuthorized) {
      showAlert("No tienes permisos.");
      return;
    }
    const fest = festivals.find((f) => f.id === festivalId) || (selectedFestival?.id === festivalId ? selectedFestival : undefined);
    const task = (fest?.tasks || []).find((t) => t.id === taskId);
    if (fest && task) {
      addAuditLog(
        "tasks",
        `${userName} ha editado la tarea '${task.title}' a '${newTitle}' en el festival '${fest.name}'.`,
      );
    }

    setFestivals((prev) =>
      prev.map((f) => {
        if (f.id === festivalId) {
          return {
            ...f,
            tasks: (f.tasks || []).map((t) =>
              t.id === taskId ? { ...t, title: newTitle } : t,
            ),
          };
        }
        return f;
      }),
    );

    syncDraftFestivalTasks(festivalId, (curr) => curr.map((t) => t.id === taskId ? { ...t, title: newTitle } : t));

    if (selectedFestival?.id === festivalId) {
      setSelectedFestival((prev) =>
        prev
          ? {
              ...prev,
              tasks: (prev.tasks || []).map((t) =>
                t.id === taskId ? { ...t, title: newTitle } : t,
              ),
            }
          : null,
      );
    }
  };

  const handleConfigTaskDeadline = (
    festivalId: string,
    taskId: string,
    dueDate: string,
  ) => {
    if (!isAuthorized) {
      showAlert("No tienes permisos.");
      return;
    }
    const fest = festivals.find((f) => f.id === festivalId) || (selectedFestival?.id === festivalId ? selectedFestival : undefined);
    const task = (fest?.tasks || []).find((t) => t.id === taskId);
    if (fest && task) {
      addAuditLog(
        "tasks",
        `${userName} ha configurado/cambiado la fecha límite de la tarea '${task.title}' a '${dueDate}' en el festival '${fest.name}'.`,
      );
    }

    setFestivals((prev) =>
      prev.map((f) => {
        if (f.id === festivalId) {
          return {
            ...f,
            tasks: (f.tasks || []).map((t) =>
              t.id === taskId ? { ...t, dueDate } : t,
            ),
          };
        }
        return f;
      }),
    );

    syncDraftFestivalTasks(festivalId, (curr) => curr.map((t) => t.id === taskId ? { ...t, dueDate } : t));

    if (selectedFestival?.id === festivalId) {
      setSelectedFestival((prev) =>
        prev
          ? {
              ...prev,
              tasks: (prev.tasks || []).map((t) =>
                t.id === taskId ? { ...t, dueDate } : t,
              ),
            }
          : null,
      );
    }
  };

  const handleDeleteFestival = (id: string) => {
    if (!isAuthorized) {
      showAlert("No tienes permisos para realizar esta acción.");
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: "¿Estás seguro de que quieres borrar este festival?",
      onConfirm: () => {
        const fest = festivals.find((f) => f.id === id) || (selectedFestival?.id === id ? selectedFestival : undefined);
        if (fest) {
          addAuditLog(
            "festivals",
            `${userName} ha eliminado el festival '${fest.name}'.`,
          );
        }
        if (fest?.esBorradorPlan && fest.distributionPlanId) {
          setDistributionPlans((prev) =>
            prev.map((plan) =>
              plan.id === fest.distributionPlanId
                ? {
                    ...plan,
                    festivalesBorrador: (plan.festivalesBorrador || []).filter((b) => b.id !== id),
                  }
                : plan
            )
          );
          setSelectedFestival(null);
          setView("distribution_plan_detail");
          return;
        }
        setFestivals(festivals.filter((f) => f.id !== id));
        setSelectedFestival(null);
        setView("festivals");
      },
    });
  };

  const toggleTask = (festivalId: string, taskId: string) => {
    if (!isAuthorized) {
      showAlert("No tienes permisos para realizar esta acción.");
      return;
    }
    const fest = festivals.find((f) => f.id === festivalId) || (selectedFestival?.id === festivalId ? selectedFestival : undefined);
    const task = fest?.tasks?.find((t) => t.id === taskId);
    if (fest && task) {
      if (!task.completed) {
        addAuditLog(
          "tasks",
          `${userName} ha completado la tarea '${task.title}' en el festival '${fest.name}'.`,
        );
      } else {
        addAuditLog(
          "tasks",
          `${userName} ha marcado la tarea '${task.title}' como pendiente en el festival '${fest.name}'.`,
        );
      }
    }

    setFestivals(
      festivals.map((f) => {
        if (f.id === festivalId) {
          return {
            ...f,
            tasks: (f.tasks || []).map((t) =>
              t.id === taskId ? { ...t, completed: !t.completed } : t,
            ),
          };
        }
        return f;
      }),
    );

    syncDraftFestivalTasks(festivalId, (curr) => curr.map((t) => t.id === taskId ? { ...t, completed: !t.completed } : t));

    if (selectedFestival?.id === festivalId) {
      setSelectedFestival((prev) =>
        prev
          ? {
              ...prev,
              tasks: (prev.tasks || []).map((t) =>
                t.id === taskId ? { ...t, completed: !t.completed } : t,
              ),
            }
          : null,
      );
    }
  };

  const [localDevSettings, setLocalDevSettings] = useState(() => {
    const saved = localStorage.getItem("localDevSettings");
    return saved
      ? JSON.parse(saved)
      : { showConsole: false, showFirebaseStats: false, showToasts: false, experimentalFeatures: false, showKeyInspector: false };
  });

  useEffect(() => {
    localStorage.setItem("localDevSettings", JSON.stringify(localDevSettings));
  }, [localDevSettings]);

  // Global UI Modals
  const [promptConfig, setPromptConfig] = useState<{
    isOpen: boolean;
    title: string;
    value: string;
    inputType?: string;
    qrSecret?: string;
    onSubmit: (val: string) => void;
  } | null>(null);
  const twoFactorSecret = devSettings?.twoFactorSecret || "";
  const setTwoFactorSecret = (secret: string) =>
    setDevSettings((prev: any) => ({ ...prev, twoFactorSecret: secret }));
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    onConfirm: () => void;
    isAlert?: boolean;
    errorCode?: string;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);
  const [alerts, setAlerts] = useState<
    { id: string; title: string; errorCode?: string }[]
  >([]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("'beforeinstallprompt' capturado y guardado en state.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Si ya se disparó la instalación, limpiamos
    const handleAppInstalled = () => {
      console.log("App instalada con éxito.");
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Elección del usuario al instalar: ${outcome}`);
    setDeferredPrompt(null);
  };

  const showAlert = (title: string, errorCode?: string) => {
    if (title === "No tienes permisos.") {
      showToast("Acción bloqueada en modo visita.");
      return;
    }
    const id = Date.now().toString() + Math.random().toString();
    setAlerts((prev) => [...prev, { id, title, errorCode }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 5000);
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleReportBug = (alert: any) => {
    const newBug: BugTicket = {
      id: Date.now().toString(),
      title: "Reporte: " + alert.title,
      description: alert.errorCode || "Sin detalles adicionales.",
      status: "open",
      priority: "high",
      dateReported: format(new Date(), "yyyy-MM-dd"),
      author: userName || "Sistema",
    };
    setBugs((prev) => [newBug, ...prev]);
    removeAlert(alert.id);
    setView("bugs");
  };

  useEffect(() => {
    const handleAppError = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        showAlert(customEvent.detail.message, customEvent.detail.errorCode);
      }
    };
    window.addEventListener("appError", handleAppError);
    return () => window.removeEventListener("appError", handleAppError);
  }, []);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelImportStats, setExcelImportStats] = useState<{
    imported: number;
    updated?: number;
    total: number;
  } | null>(null);

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  // VISTA DEL CALENDARIO
  const renderCalendar = () => {
    return (
      <CalendarView
        activeFestivals={activeFestivals}
        festivals={festivals}
        reminders={reminders}
        socialPosts={socialPosts}
        members={members}
        currentMonthDate={currentMonthDate}
        setCurrentMonthDate={setCurrentMonthDate}
        selectedCalendarDate={selectedCalendarDate}
        setSelectedCalendarDate={setSelectedCalendarDate}
        setView={setView}
        setSelectedFestival={setSelectedFestival}
        setEditingReminder={setEditingReminder}
        setIsReminderModalOpen={setIsReminderModalOpen}
        deleteReminder={deleteReminder}
      />
    );
  };

  const handleMigrateToCloud = async () => {
    try {
      const localFestivals = localStorage.getItem("festivals");
      if (localFestivals) await setFestivals(JSON.parse(localFestivals));
      else await setFestivals(INITIAL_FESTIVALS);

      const localMembers = localStorage.getItem("authmembers");
      if (localMembers) await setMembers(JSON.parse(localMembers));
      else await setMembers(ADMINS);

      const localBugs = localStorage.getItem("bugs");
      if (localBugs) await setBugs(JSON.parse(localBugs));

      const localNotes = localStorage.getItem("notes");
      if (localNotes) await setNotes(JSON.parse(localNotes));

      const localRoadmap = localStorage.getItem("roadmap");
      if (localRoadmap) await setRoadmap(JSON.parse(localRoadmap));

      const localNotifications = localStorage.getItem("notifications");
      if (localNotifications)
        await setNotifications(JSON.parse(localNotifications));

      const localAuditLogs = localStorage.getItem("auditlogs");
      if (localAuditLogs) await setAuditLogs(JSON.parse(localAuditLogs));

      const localSocialPosts = localStorage.getItem("local_social_posts");
      if (localSocialPosts) await setSocialPosts(JSON.parse(localSocialPosts));

      const localReminders = localStorage.getItem("local_reminders");
      if (localReminders) await setReminders(JSON.parse(localReminders));

      const localGallery = localStorage.getItem("local_gallery");
      if (localGallery) await setGallery(JSON.parse(localGallery));

      const localFilmData = localStorage.getItem("local_film_data") || localStorage.getItem("local_filmData_Cardigan");
      if (localFilmData) await setFilmData(JSON.parse(localFilmData));

      showToast("Datos migrados a la nube exitosamente!");
    } catch (e) {
      console.error(e);
      showToast("Error al migrar datos.");
    }
  };

  // VISTA DE NOTIFICACIONES ELIMINADA

  // VISTA DE AYUDA (Movida a src/components/ProductionNotes.tsx)

  if (loading) {
    return <AppSplashScreen />;
  }

  if (!user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url(/images/bg_login.jpg)" }}
      >
        <GlobalEffects />
        <div className="relative z-10 max-w-md w-full p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col items-center border border-white/50">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight mb-8 text-center">
            Festis
          </h1>
          <button
            onClick={loginWithGoogle}
            className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition shadow-lg flex items-center justify-center gap-3"
          >
            <User className="h-5 w-5" />
            Iniciar Sesión con Google
          </button>
          
          <button
            type="button"
            onClick={() => loginAsDirect("axeldibarra@gmail.com", "Axel Ibarra")}
            className="mt-3 w-full py-3 bg-white/90 hover:bg-white text-slate-700 text-sm font-semibold rounded-xl transition border border-slate-200/90 shadow-sm flex items-center justify-center gap-2"
          >
            Acceder como Axel Ibarra
          </button>
          
          {authError && (
            <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl w-full text-sm font-medium border border-red-100 flex flex-col items-start gap-3">
               <div className="flex gap-3">
                 <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                 <p>{authError}</p>
               </div>
               
               {debugLogs && debugLogs.length > 0 && (
                 <div className="mt-4 w-full p-3 bg-red-100/50 rounded-lg max-h-48 overflow-y-auto">
                    <p className="text-xs font-bold mb-2 text-red-800">Logs de desarrollo:</p>
                    <ul className="text-[10px] space-y-1 font-mono">
                      {debugLogs.map((log, i) => (
                        <li key={`dev-log-${i}`} className="pb-1 border-b border-red-200/50 break-all">{log}</li>
                      ))}
                    </ul>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (effectiveRole === "externo") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-pink-50 to-white">
        <GlobalEffects />
        <div className="max-w-md w-full p-8 bg-white rounded-3xl shadow-2xl flex flex-col items-center text-center">
          <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shadow-inner mb-6">
            <Lock className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
            Acceso Denegado
          </h1>
          <p className="text-slate-500 mb-8 font-medium">
            No tienes acceso a esta app. Contacta con el desarrollador.
          </p>
          <button
            onClick={logout}
            className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition shadow-lg"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialSyncDone) {
    return <AppSplashScreen initialMessage="Cargando, espera un momento..." />;
  }

  return (
    <div
      className={cn(
        "flex flex-col min-h-screen transition-colors duration-1000",
        view === "play_zone"
          ? "bg-black"
          : "bg-transparent",
      )}
    >
      <GlobalEffects />

      {/* Hidden portal button to trigger play_zone transition */}
      <button
        id="btn-play-zone-portal"
        className="hidden"
        onClick={() => handleGlobalTransition("play_zone")}
      />

      {/* Global Transition Overlay acting as an expanding portal */}
      <AnimatePresence>
        {globalTransition.active && (
          <motion.div
            key="global-transition-overlay"
            initial={{ clipPath: "circle(0% at 50% 50%)" }}
            animate={{ clipPath: "circle(150% at 50% 50%)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed inset-0 bg-black z-[9999] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Menú Lateral de la Obra Activa */}
      <AnimatePresence>
        {isSidebarOpen && Boolean(currentProject) && (
          <React.Fragment key="sidebar-menu-fragment">
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]"
            />
            <motion.div
              key="sidebar-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed top-0 right-0 h-full w-72 max-w-[80vw] bg-white shadow-2xl z-[101] flex flex-col pt-12 pb-6 px-6 border-l border-slate-200 no-print"
            >
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100/50 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-8 text-center flex flex-col items-center">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-1">
                  Festis
                  {currentProject && (
                    <span className="text-[#e91e63] text-xs font-semibold block mt-0.5">
                      {currentProject.name}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {user?.email}
                </p>

                <div className="flex flex-col items-center gap-2 mt-3">
                  <span
                    className={cn(
                      "text-xs px-2.5 py-0.5 rounded-full inline-block font-semibold border",
                      isAuthorized
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-700 border-red-200",
                    )}
                  >
                    {isAuthorized ? "Acceso Autorizado" : "Solo Lectura"}
                  </span>
                </div>
              </div>

              {!currentProject ? (
                <div className="flex flex-col justify-between flex-1 overflow-y-auto w-full">
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setView("config");
                        setIsSidebarOpen(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm border-2",
                        view === "config"
                          ? "bg-[#ffd3e7] text-[#e91e63] border-pink-200 shadow-md"
                          : "bg-white text-slate-600 border-slate-200 hover:border-[#e91e63] hover:bg-slate-50",
                      )}
                    >
                      <Settings className="h-5 w-5 text-[#e91e63]" />
                      <span>Configuración de la App</span>
                    </button>

                    <button
                      onClick={() => {
                        setView("help");
                        setIsSidebarOpen(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm border-2",
                        view === "help"
                          ? "bg-blue-100 text-blue-600 border-blue-200 shadow-md"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-500 hover:bg-slate-50",
                      )}
                    >
                      <HelpCircle className="h-5 w-5 text-blue-600" />
                      <span>Ayuda</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-slate-200 mt-auto">
                    <button
                      onClick={() => {
                        setIsSidebarOpen(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-bold text-sm bg-slate-900 text-white hover:bg-rose-700 shadow-md active:scale-95"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              ) : (
                <nav className="flex flex-col gap-3 flex-1 overflow-y-auto w-full">
                <button
                  onClick={() => {
                    setView("dashboard");
                    setIsSidebarOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm border-2",
                    view === "dashboard"
                      ? "bg-[#e91e63] text-white border-[#e91e63] shadow-md shadow-[#e91e63]/20"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[#e91e63] hover:bg-slate-50",
                  )}
                >
                  <Home
                    className={cn(
                      "h-4 w-4",
                      view === "dashboard" ? "text-white" : "text-[#e91e63]",
                    )}
                  />{" "}
                  Inicio
                </button>
                <button
                  onClick={() => {
                    setView("planning");
                    setIsSidebarOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm border-2",
                    view === "planning"
                      ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20"
                      : "bg-white text-slate-600 border-slate-200 hover:border-purple-500 hover:bg-slate-50",
                  )}
                >
                  <PenTool
                    className={cn(
                      "h-4 w-4",
                      view === "planning" ? "text-white" : "text-purple-600",
                    )}
                  />{" "}
                  Planificación (Pizarra)
                </button>
                <React.Fragment>
                  <>
                    {effectiveRole !== "visitante" && (
                      <button
                        onClick={() => {
                          setView("film_data");
                          setIsSidebarOpen(false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                          view === "film_data"
                            ? "bg-purple-100 text-purple-600 shadow-md border-2 border-purple-200"
                            : "bg-white text-slate-600 border-2 border-slate-200 hover:border-[#e91e63] hover:bg-slate-50",
                        )}
                      >
                        <Projector
                          className={cn(
                            "h-4 w-4",
                            view === "film_data"
                              ? "text-purple-600"
                              : "text-purple-500",
                          )}
                        />{" "}
                        Datos del Film
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setView("reports");
                        setIsSidebarOpen(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                        view === "reports"
                          ? "bg-amber-100 text-amber-600 shadow-md border-2 border-amber-200"
                          : "bg-white text-slate-600 border-2 border-slate-200 hover:border-[#e91e63] hover:bg-slate-50",
                      )}
                    >
                      <FileDown
                        className={cn(
                          "h-4 w-4",
                          view === "reports"
                            ? "text-amber-600"
                            : "text-amber-500",
                        )}
                      />{" "}
                      Informes
                    </button>
                    <button
                      onClick={() => {
                        setView("gallery");
                        setIsSidebarOpen(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                        view === "gallery"
                          ? "bg-fuchsia-100 text-fuchsia-600 shadow-md border-2 border-fuchsia-200"
                          : "bg-white text-slate-600 border-2 border-slate-200 hover:border-[#e91e63] hover:bg-slate-50",
                      )}
                    >
                      <Image
                        className={cn(
                          "h-4 w-4",
                          view === "gallery"
                            ? "text-fuchsia-600"
                            : "text-fuchsia-500",
                        )}
                      />{" "}
                      Galería
                    </button>
                    {effectiveRole !== "visitante" && (
                      <button
                        onClick={() => {
                          setView("notes");
                          setIsSidebarOpen(false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                          view === "notes"
                            ? "bg-[#fce4ec] text-[#e91e63] shadow-md border-2 border-[#f8bbd0]"
                            : "bg-white text-slate-600 border-2 border-slate-200 hover:border-[#e91e63] hover:bg-slate-50",
                        )}
                      >
                        <FileText
                          className={cn(
                            "h-4 w-4",
                            view === "notes"
                              ? "text-[#e91e63]"
                              : "text-[#f06292]",
                          )}
                        />{" "}
                        Notas
                      </button>
                    )}

                    {effectiveRole !== "visitante" && (
                      <button
                        onClick={() => {
                          setView("archive");
                          setIsSidebarOpen(false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                          view === "archive"
                            ? "bg-slate-800 text-white shadow-md border-2 border-slate-700"
                            : "bg-white text-slate-600 border-2 border-slate-200 hover:border-[#e91e63] hover:bg-slate-50",
                        )}
                      >
                        <Archive
                          className={cn(
                            "h-4 w-4",
                            view === "archive"
                              ? "text-slate-300"
                              : "text-slate-500",
                          )}
                        />{" "}
                        Baúl de Festis
                      </button>
                    )}
                  </>
                </React.Fragment>
                <div className="mt-auto flex flex-col gap-3">
                  {effectiveRole !== "visitante" && (
                    <button
                      onClick={() => {
                        setView("bugs");
                        setIsSidebarOpen(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                        view === "bugs"
                          ? "bg-indigo-100 text-indigo-600 shadow-md border-2 border-indigo-200"
                          : "bg-white text-slate-600 border-2 border-slate-200 hover:border-[#e91e63] hover:bg-slate-50",
                      )}
                    >
                      <AlertCircle
                        className={cn(
                          "h-4 w-4",
                          view === "bugs"
                            ? "text-indigo-600"
                            : "text-indigo-500",
                        )}
                      />{" "}
                      Bug Tracker
                    </button>
                  )}
                  {effectiveRole !== "visitante" && (
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => {
                          setView("help");
                          setIsSidebarOpen(false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        title="Manual de Ayuda"
                        className={cn(
                          "flex-1 flex justify-center items-center py-4 rounded-xl transition-all border-2",
                          view === "help"
                            ? "bg-blue-100 text-blue-600 shadow-md border-blue-200"
                            : "bg-white text-slate-600 border-slate-200 hover:border-[#e91e63] hover:bg-slate-50",
                        )}
                      >
                        <HelpCircle
                          className={cn(
                            "h-7 w-7",
                            view === "help" ? "text-blue-600" : "text-blue-500",
                          )}
                        />
                      </button>
                      <button
                        onClick={() => {
                          setView("config");
                          setIsSidebarOpen(false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        title="Configuración"
                        className={cn(
                          "flex-1 flex justify-center items-center py-4 rounded-xl transition-all border-2",
                          view === "config"
                            ? "bg-[#ffd3e7] text-[#e91e63] shadow-md border-pink-200"
                            : "bg-white text-slate-600 border-slate-200 hover:border-[#e91e63] hover:bg-slate-50",
                        )}
                      >
                        <Settings
                          className={cn(
                            "h-7 w-7",
                            view === "config"
                              ? "text-[#e91e63]"
                              : "text-pink-500",
                          )}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </nav>
            )}
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Immersive Header */}
      {currentProject && view !== "play_zone" && view !== "docs" && (
        <AppHeader
          view={view}
          setView={setView}
          onReloadPlanning={() => planningRef.current?.reloadBoard()}
          search={search}
          setSearch={setSearch}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          dateRangeStart={dateRangeStart}
          setDateRangeStart={setDateRangeStart}
          dateRangeEnd={dateRangeEnd}
          setDateRangeEnd={setDateRangeEnd}
          setIsSidebarOpen={setIsSidebarOpen}
          hasBirthdayToday={hasBirthdayToday}
          searchInObs={searchInObs}
          setSearchInObs={setSearchInObs}
          onlyFree={onlyFree}
          setOnlyFree={setOnlyFree}
          onlyWithTasks={onlyWithTasks}
          setOnlyWithTasks={setOnlyWithTasks}
          selectedCountries={selectedCountries}
          setSelectedCountries={setSelectedCountries}
          availableCountries={availableCountries}
          deferredPrompt={deferredPrompt}
          handleInstallClick={handleInstallClick}
          onOpenOmnibox={() => setIsOmniboxOpen(true)}
        />
      )}

      <div className="flex flex-1">
        {/* Main Content Area */}
        <main
          className={cn(
            "flex-1 w-full mx-auto",
            !currentProject
              ? view === "help"
                ? "max-w-4xl pt-6 pb-20 px-4"
                : "max-w-none p-0"
              : view === "play_zone" || view === "docs"
              ? "max-w-none pt-0 pb-0 px-0"
              : view === "planning"
              ? "max-w-7xl pt-20 pb-2 px-2 sm:px-4 p-4"
              : "max-w-2xl pt-44 pb-32 p-4",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={
                view === "play_zone"
                  ? { opacity: 0, scale: 0.95 }
                  : { opacity: 0, y: 10 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                view === "play_zone"
                  ? { opacity: 0, transition: { duration: 1 } }
                  : { opacity: 0, y: -10 }
              }
              transition={{
                duration:
                  view === "play_zone"
                    ? 1.5
                    : 0.2,
                ease: "easeInOut",
              }}
              className={cn(
                view === "play_zone"
                  ? "h-full w-full absolute inset-0 bg-transparent"
                  : "",
              )}
            >
              <Suspense
                fallback={
                  <div className="p-12 text-center text-slate-600 font-bold text-xs flex flex-col items-center justify-center gap-4">
                    <div className="w-6 h-6 border-2 border-[#e91e63] border-t-transparent rounded-full animate-spin"></div>
                    Cargando módulo...
                  </div>
                }
              >
                {!currentProject && view !== "config" && view !== "help" && view !== "docs" ? (
                  <ProjectsHomeView
                    onOpenConfig={() => setView("config")}
                    onOpenHelp={() => setView("help")}
                  />
                ) : !currentProject && view === "config" ? (
                  <AppSettingsView
                    onBackToProjects={() => setView("dashboard")}
                  />
                ) : (
                  <>
                    {!currentProject && (
                      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 mb-6 flex items-center justify-between shadow-xs rounded-2xl">
                        <button
                          type="button"
                          onClick={() => setView("dashboard")}
                          className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-pink-600 transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Volver a Catálogo de Obras</span>
                        </button>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                          {view === "config" ? "Configuración" : "Ayuda"}
                        </span>
                      </div>
                    )}
                    {view === "dashboard" && (
                  <ErrorBoundary
                    sectionName="Dashboard"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <DashboardView
                      notifications={notifications}
                      reminders={reminders}
                      festivals={festivals}
                      isExcelModalOpen={isExcelModalOpen}
                      setIsExcelModalOpen={setIsExcelModalOpen}
                      excelImportStats={excelImportStats}
                      isPdfModalOpen={isPdfModalOpen}
                      setIsPdfModalOpen={setIsPdfModalOpen}
                      handleExportPDF={handleExportPDF}
                      setSelectedFestival={setSelectedFestival}
                      setView={setView as any}
                    />
                  </ErrorBoundary>
                )}
                {view === "film_data" && (
                  <ErrorBoundary
                    sectionName="Ficha Técnica"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <FilmDataView
                      isAuthorized={isAuthorized}
                      filmData={filmData}
                      setFilmData={setFilmData}
                      showAlert={showAlert}
                      addAuditLog={addAuditLog}
                      userName={userName || "Usuario"}
                    />
                  </ErrorBoundary>
                )}
                {view === "festivals" && (
                  <ErrorBoundary
                    sectionName="Festivales"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <FestivalListView
                      festivals={festivals}
                      filteredFestivals={filteredFestivals}
                      setFestivals={setFestivals}
                      filterStatus={filterStatus as any}
                      setFilterStatus={setFilterStatus as any}
                      dateFilter={dateFilter as any}
                      setDateFilter={setDateFilter as any}
                      displayedCount={displayedCount}
                      setDisplayedCount={setDisplayedCount}
                      setSelectedFestival={setSelectedFestival}
                      setView={setView as any}
                      search={search}
                      searchInObs={searchInObs}
                      handleUpdateStatus={handleUpdateStatus}
                    />
                  </ErrorBoundary>
                )}
                {view === "tasks" && (
                  <ErrorBoundary
                    sectionName="Tareas"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <TasksView
                      festivals={festivals}
                      taskSearch={taskSearch}
                      setTaskSearch={setTaskSearch}
                      toggleTask={toggleTask}
                    />
                  </ErrorBoundary>
                )}
                {view === "planning" && (
                  <ErrorBoundary
                    sectionName="Planificación"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <PlanningView
                      ref={planningRef}
                      userName={userName}
                      isAuthorized={isAuthorized}
                    />
                  </ErrorBoundary>
                )}
                {view === "calendar" && (
                  <ErrorBoundary
                    sectionName="Calendario"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    {renderCalendar()}
                  </ErrorBoundary>
                )}
                {view === "stats" && (
                  <ErrorBoundary
                    sectionName="Estadísticas"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <StatsView
                      setView={setView}
                      festivals={festivals}
                      auditLogs={auditLogs}
                      onExportCSV={exportCSV}
                      onExportPDF={handleExportPDF}
                      onExportProjectionsPDF={handleExportProjectionsPDF}
                      onViewDetails={(f) => {
                        setSelectedFestival(f);
                        setView("details");
                      }}
                    />
                  </ErrorBoundary>
                )}
                {view === "details" && selectedFestival && (
                  <ErrorBoundary
                    sectionName="Detalles de Festival"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <FestivalDetailsView
                      festival={
                        festivals.find(
                          (fest) => fest.id === selectedFestival.id,
                        ) || selectedFestival
                      }
                      isAuthorized={isAuthorized}
                      setView={setView as any}
                      previousView={previousView}
                      setModalType={setModalType}
                      setIsModalOpen={setIsModalOpen}
                      handleDeleteFestival={handleDeleteFestival}
                      setPromptConfig={setPromptConfig}
                      setConfirmConfig={setConfirmConfig}
                      handleAddTask={handleAddTask}
                      handleEditTask={handleEditTask}
                      handleConfigTaskDeadline={handleConfigTaskDeadline}
                      handleDeleteTask={handleDeleteTask}
                      toggleTask={toggleTask}
                      handleUpdatePin={handleUpdatePin}
                      handleArchiveFestival={handleArchiveFestival}
                      handleUpdateStatus={handleUpdateStatus}
                      showToast={showToast}
                      isDebugMode={isDebugMode}
                      festivals={festivals}
                      distributionPlans={distributionPlans}
                      setSelectedFestival={setSelectedFestival}
                      onUpdateFestival={(updatedFest) => {
                        setFestivals((prev) =>
                          prev.map((item) =>
                            item.id === updatedFest.id ? updatedFest : item,
                          ),
                        );
                        if (updatedFest.esBorradorPlan && updatedFest.distributionPlanId) {
                          setDistributionPlans((prev) =>
                            prev.map((plan) =>
                              plan.id === updatedFest.distributionPlanId
                                ? {
                                    ...plan,
                                    festivalesBorrador: (plan.festivalesBorrador || []).map((fb) =>
                                      fb.id === updatedFest.id ? updatedFest : fb
                                    ),
                                  }
                                : plan
                            )
                          );
                        }
                        setSelectedFestival(updatedFest);
                      }}
                      reminders={reminders}
                      setEditingReminder={setEditingReminder}
                      setIsReminderModalOpen={setIsReminderModalOpen}
                      deleteReminder={deleteReminder}
                    />
                  </ErrorBoundary>
                )}
                {view === "notes" && (
                  <ErrorBoundary
                    sectionName="Notas de Producción"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <ProductionNotes
                      notes={notes}
                      setNotes={setNotes}
                      userName={userName}
                      addNotification={addNotification}
                      showAlert={showAlert}
                      addAuditLog={addAuditLog}
                    />
                  </ErrorBoundary>
                )}
                {view === "config" && (
                  <ErrorBoundary
                    sectionName="Configuración"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    {!isAuthorized ? (
                      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                        <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 shadow-inner">
                          <Lock className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                          Acceso Restringido
                        </h2>
                        <p className="text-slate-500 max-w-sm">
                          No tienes acceso a la Configuración. Contacta al
                          administrador si crees que esto es un error.
                        </p>
                      </div>
                    ) : (
                      <ConfigView
                        configTab={configTab}
                        setConfigTab={setConfigTab}
                        userEmail={userEmail!}
                        userName={userName!}
                        isDebugMode={isDebugMode}
                        setIsDebugMode={setIsDebugMode}
                        twoFactorSecret={twoFactorSecret}
                        setTwoFactorSecret={setTwoFactorSecret}
                        showAlert={showAlert}
                        setPromptConfig={setPromptConfig}
                        isAuthorized={isAuthorized}
                        logout={logout}
                        isDesaturated={isDesaturated}
                        setIsDesaturated={(val) => {
                           setIsDesaturated(val);
                           localStorage.setItem("isDesaturated", String(val));
                        }}
                        usePaperShader={usePaperShader}
                        setUsePaperShader={(val) => {
                           setUsePaperShader(val);
                           localStorage.setItem("usePaperShader", String(val));
                        }}
                        paperOpacity={paperOpacity}
                        setPaperOpacity={(val) => {
                           setPaperOpacity(val);
                           localStorage.setItem("paperOpacity", String(val));
                        }}
                        paperBlendMode={paperBlendMode}
                        setPaperBlendMode={(val) => {
                           setPaperBlendMode(val);
                           localStorage.setItem("paperBlendMode", val);
                        }}
                        useCmykShader={useCmykShader}
                        setUseCmykShader={(val) => {
                           setUseCmykShader(val);
                           localStorage.setItem("useCmykShader", String(val));
                        }}
                        cmykOpacity={cmykOpacity}
                        setCmykOpacity={(val) => {
                           setCmykOpacity(val);
                           localStorage.setItem("cmykOpacity", String(val));
                        }}
                        cmykBlendMode={cmykBlendMode}
                        setCmykBlendMode={(val) => {
                           setCmykBlendMode(val);
                           localStorage.setItem("cmykBlendMode", val);
                        }}
                        useGrainShader={useGrainShader}
                        setUseGrainShader={(val) => {
                           setUseGrainShader(val);
                           localStorage.setItem("useGrainShader", String(val));
                        }}
                        grainOpacity={grainOpacity}
                        setGrainOpacity={(val) => {
                           setGrainOpacity(val);
                           localStorage.setItem("grainOpacity", String(val));
                        }}
                        grainBlendMode={grainBlendMode}
                        setGrainBlendMode={(val) => {
                           setGrainBlendMode(val);
                           localStorage.setItem("grainBlendMode", val);
                        }}
                        paperParams={paperParams}
                        updatePaperParam={updatePaperParam}
                        cmykParams={cmykParams}
                        updateCmykParam={updateCmykParam}
                        grainParams={grainParams}
                        updateGrainParam={updateGrainParam}
                        realIsDev={realIsDev}
                        testRole={testRole}
                        setTestRole={setTestRole as any}
                        effectiveRole={effectiveRole}
                        devSettings={devSettings}
                        setDevSettings={setDevSettings}
                        localDevSettings={localDevSettings}
                        setLocalDevSettings={setLocalDevSettings}
                        setView={setView}
                        setEasterEggUnlocked={setEasterEggUnlocked}
                        members={members}
                        setMembers={setMembers}
                        isAdmin={isAdmin!}
                        addAuditLog={addAuditLog}
                        setConfirmConfig={setConfirmConfig}
                        festivals={festivals}
                        setFestivals={setFestivals}
                        setIsExcelModalOpen={setIsExcelModalOpen}
                        setExcelImportStats={setExcelImportStats}
                        handleMigrateToCloud={handleMigrateToCloud}
                        migrateOldCollection={migrateOldCollection}
                        exportDB={exportDB}
                        exportDBExcel={exportDBExcel}
                        importDB={importDB}
                        downloadCollection={downloadCollection}
                        notifications={notifications}
                        bugs={bugs}
                        roadmap={roadmap}
                        auditLogs={auditLogs}
                        auditSearchTerm={auditSearchTerm}
                        setAuditSearchTerm={setAuditSearchTerm}
                        handleExportAuditPDF={handleExportAuditPDF}
                        setNotifications={setNotifications}
                        setAuditLogs={setAuditLogs}
                        setNotes={setNotes}
                        setBugs={setBugs}
                        setRoadmap={setRoadmap}
                        setFilmData={setFilmData}
                        filmData={filmData}
                        notes={notes}
                        socialPosts={socialPosts}
                        reminders={reminders}
                        gallery={gallery}
                        platforms={platforms}
                        setPlatforms={setPlatforms}
                        institutions={institutions}
                        setInstitutions={setInstitutions}
                        distributionPlans={distributionPlans}
                      />
                    )}
                  </ErrorBoundary>
                )}
                {view === "reports" && (
                  <ErrorBoundary
                    sectionName="Informes"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    {effectiveRole === "externo" ? (
                      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                        <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 shadow-inner">
                          <Lock className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                          Acceso Restringido
                        </h2>
                        <p className="text-slate-500 max-w-sm">
                          No tienes acceso a los Informes. Contacta al
                          administrador si crees que esto es un error.
                        </p>
                      </div>
                    ) : (
                      <ReportsView
                        festivals={festivals}
                        auditLogs={auditLogs}
                        onExportPDF={handleExportPDF}
                        onExportProjectionsPDF={handleExportProjectionsPDF}
                        onExportAuditPDF={handleExportAuditPDF}
                        onExportLaurelsPDF={handleExportLaurelsPDF}
                        onExportStatsPDF={handleExportStatsPDF}
                        onExportCSV={async () => exportCSV()}
                        setIsPdfModalOpen={setIsPdfModalOpen}
                        userName={userName}
                        showToast={showToast}
                      />
                    )}
                  </ErrorBoundary>
                )}
                {view === "gallery" && (
                  <ErrorBoundary
                    sectionName="Galería"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <GalleryView
                      gallery={gallery}
                      setGallery={setGallery}
                      festivals={festivals}
                      filmData={filmData}
                      showAlert={showAlert}
                      isAuthorized={isAuthorized}
                    />
                  </ErrorBoundary>
                )}
                {view === "bugs" && (
                  <ErrorBoundary
                    sectionName="Bug Tracker"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <BugsRoadmapView
                      bugs={bugs}
                      setBugs={setBugs}
                      showAlert={showAlert}
                      addAuditLog={addAuditLog}
                      userName={userName}
                      isAuthorized={isAuthorized}
                    />
                  </ErrorBoundary>
                )}
                {view === "help" && (
                  <ErrorBoundary
                    sectionName="Manual de Ayuda"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    {!isAuthorized ? (
                      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                        <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 shadow-inner">
                          <Lock className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                          Acceso Restringido
                        </h2>
                        <p className="text-slate-500 max-w-sm">
                          No tienes acceso al Manual. Contacta al administrador
                          si crees que esto es un error.
                        </p>
                      </div>
                    ) : (
                      <HelpView />
                    )}
                  </ErrorBoundary>
                )}
                {view === "easter_egg" && (
                  <EasterEggView
                    showToast={showToast}
                    addAuditLog={addAuditLog}
                    userName={userName}
                  />
                )}
                {view === "social_media" && (
                  <ErrorBoundary
                    sectionName="Modo Redes"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <SocialMediaView
                      festivals={festivals}
                      gallery={gallery}
                      tasks={festivals.flatMap((f) => f.tasks || [])}
                      userName={userName!}
                      showAlert={showAlert}
                      showToast={showToast}
                      setView={setView}
                      isAuthorized={isAuthorized}
                      setConfirmConfig={setConfirmConfig}
                    />
                  </ErrorBoundary>
                )}
                {view === "archive" && (
                  <ErrorBoundary
                    sectionName="Archivo"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <ArchiveView
                      festivals={festivals}
                      setFestivals={setFestivals}
                      setSelectedFestival={setSelectedFestival}
                      setView={setView as any}
                      isAuthorized={isAuthorized}
                      showAlert={showAlert}
                    />
                  </ErrorBoundary>
                )}

                {view === "distribution_plans" && (
                  <ErrorBoundary
                    sectionName="Planes de Distribución"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <DistributionPlansView
                      distributionPlans={distributionPlans}
                      setDistributionPlans={setDistributionPlans}
                      institutions={institutions}
                      festivals={festivals}
                      setFestivals={setFestivals}
                      addAuditLog={addAuditLog}
                      showAlert={showAlert}
                      userName={userName || "Usuario"}
                      isAuthorized={isAuthorized}
                      setView={setView}
                      onSelectPlan={(planId) => {
                        setSelectedDistributionPlanId(planId);
                        setView("distribution_plan_detail");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </ErrorBoundary>
                )}

                {view === "distribution_plan_detail" && selectedDistributionPlanId && (
                  <ErrorBoundary
                    sectionName="Detalles del Plan de Distribución"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <DistributionPlanDetailView
                      planId={selectedDistributionPlanId}
                      distributionPlans={distributionPlans}
                      setDistributionPlans={setDistributionPlans}
                      festivals={festivals}
                      setFestivals={setFestivals}
                      institutions={institutions}
                      addAuditLog={addAuditLog}
                      showAlert={showAlert}
                      userName={userName || "Usuario"}
                      isAuthorized={isAuthorized}
                      onBack={() => {
                        setView("distribution_plans");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      onSelectFestival={(fest) => {
                        setSelectedFestival(fest);
                        setView("details");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </ErrorBoundary>
                )}

                {view === "play_zone" && (
                  <ErrorBoundary
                    sectionName="Secretos"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <PlayZoneView setView={setView} userEasterEggs={userEasterEggs} />
                  </ErrorBoundary>
                )}

                {view === "theme_showcase" && (
                  <ErrorBoundary
                    sectionName="Laboratorio UI"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <ThemeDesignSystemShowcaseView onBack={() => setView("config")} />
                  </ErrorBoundary>
                )}

                {view === "docs" && (
                  <ErrorBoundary
                    sectionName="Documentación Wiki"
                    addAuditLog={addAuditLog}
                    showAlert={showAlert}
                    setView={setView}
                  >
                    <DocsWikiView
                      onBackToApp={() => {
                        setConfigTab("info");
                        setView("config");
                      }}
                    />
                  </ErrorBoundary>
                )}
                  </>
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Navigation (Preserved for small screens, adjusted for theme) */}
      {currentProject &&
        view !== "play_zone" &&
        view !== "social_media" &&
        view !== "planning" &&
        view !== "docs" && (
          <nav className="fixed bottom-6 left-0 right-0 w-full flex justify-center px-4 z-50 no-print pointer-events-none">
            <div className="w-full max-w-lg sm:max-w-xl flex items-center justify-around py-2.5 sm:py-3.5 px-2 sm:px-4 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)] border-2 border-slate-300 pointer-events-auto rounded-[2rem]">
              <button
                id="btn-auto-33"
                onClick={() => setView("dashboard")}
                className={cn(
                  "p-2 sm:p-2.5 transition-all flex flex-col items-center justify-center hover:text-[#e91e63] hover:scale-110",
                  view === "dashboard"
                    ? "text-[#e91e63] scale-110 -rotate-3"
                    : "text-slate-600",
                )}
                title="Inicio"
              >
                <HandDrawnHome className="h-7 w-7 sm:h-8 sm:w-8" />
              </button>
              <button
                id="btn-auto-34"
                onClick={() => setView("festivals")}
                className={cn(
                  "p-2 sm:p-2.5 transition-all flex flex-col items-center justify-center hover:text-[#e91e63] hover:scale-110",
                  view === "festivals"
                    ? "text-[#e91e63] scale-110 rotate-3"
                    : "text-slate-600",
                )}
                title="Festivales"
              >
                <HandDrawnList className="h-7 w-7 sm:h-8 sm:w-8" />
              </button>
              <button
                id="btn-auto-35"
                onClick={() => setView("tasks")}
                className={cn(
                  "p-2 sm:p-2.5 transition-all flex flex-col items-center justify-center hover:text-[#e91e63] hover:scale-110",
                  view === "tasks"
                    ? "text-[#e91e63] scale-110 -rotate-3"
                    : "text-slate-600",
                )}
                title="Tareas"
              >
                <HandDrawnTasks className="h-7 w-7 sm:h-8 sm:w-8" />
              </button>
              <button
                id="btn-auto-36"
                onClick={() => setView("calendar")}
                className={cn(
                  "p-2 sm:p-2.5 transition-all flex flex-col items-center justify-center hover:text-[#e91e63] hover:scale-110",
                  view === "calendar"
                    ? "text-[#e91e63] scale-110 rotate-3"
                    : "text-slate-600",
                )}
                title="Calendario"
              >
                <HandDrawnCalendar className="h-7 w-7 sm:h-8 sm:w-8" />
              </button>
              <button
                id="btn-auto-37"
                onClick={() => setView("stats")}
                className={cn(
                  "p-2 sm:p-2.5 transition-all flex flex-col items-center justify-center hover:text-[#e91e63] hover:scale-110",
                  view === "stats"
                    ? "text-[#e91e63] scale-110 -rotate-3"
                    : "text-slate-600",
                )}
                title="Estadísticas"
              >
                <HandDrawnStats className="h-7 w-7 sm:h-8 sm:w-8" />
              </button>
              <button
                id="btn-auto-distribution"
                onClick={() => {
                  setView("distribution_plans");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "p-2 sm:p-2.5 transition-all flex flex-col items-center justify-center hover:text-[#e91e63] hover:scale-110",
                  view === "distribution_plans" || view === "distribution_plan_detail"
                    ? "text-[#e91e63] scale-110 rotate-3"
                    : "text-slate-600",
                )}
                title="Planes de Distribución"
              >
                <HandDrawnCompass className="h-7 w-7 sm:h-8 sm:w-8" />
              </button>
              {easterEggUnlocked && (
                <button
                  onClick={() => setView("easter_egg")}
                  className={cn(
                    "p-2 sm:p-2.5 transition-all flex flex-col items-center justify-center hover:text-[#e91e63] hover:scale-110",
                    view === "easter_egg"
                      ? "text-[#e91e63] scale-110 rotate-6"
                      : "text-amber-500",
                  )}
                >
                  <HandDrawnHelp className="h-7 w-7 sm:h-8 sm:w-8" />
                </button>
              )}
            </div>
          </nav>
        )}

      {/* Botón flotante unificado para añadir festival (con glow sutil y animación reactiva) */}
      {Boolean(currentProject) && (view === "dashboard" || view === "festivals") && isAuthorized && (
        <div className="fixed bottom-36 left-0 right-0 pointer-events-none z-[60] px-4">
          <div className="max-w-2xl mx-auto w-full flex flex-col items-end gap-4">
            {renderDebugFAB()}
            <button
              id="btn-auto-global-add-festival"
              onClick={() => {
                setModalType('create');
                setIsModalOpen(true);
              }}
              className="pointer-events-auto h-16 w-16 rounded-full bg-gradient-to-tr from-[#f48fb1] to-[#e91e63] shadow-[0_8px_30px_rgba(233,30,99,0.5),_0_0_20px_rgba(233,30,99,0.3)] hover:shadow-[0_12px_40px_rgba(233,30,99,0.7),_0_0_30px_rgba(233,30,99,0.5)] border-2 border-white/45 flex items-center justify-center text-white transition-all duration-200 ease-out hover:scale-105 active:scale-90 active:rotate-12 active:brightness-95 active:shadow-[0_4px_12px_rgba(233,30,99,0.3)]"
            >
              <Plus className="h-8 w-8 stroke-[3px]" />
            </button>
          </div>
        </div>
      )}

      {/* Global UI Modals */}
      <AnimatePresence>
        {promptConfig && promptConfig.isOpen && (
          <motion.div
            key="global-prompt-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#e91e63]/40 backdrop-blur-sm flex items-center justify-center z-[150] p-4"
          >
            <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl space-y-4">
              <h3 className="text-sm font-bold text-slate-800">
                {promptConfig.title}
              </h3>
              {promptConfig.qrSecret && (
                <div className="flex flex-col items-center py-4 bg-white rounded-xl space-y-4">
                  <QRCodeSVG
                    value={`otpauth://totp/FestisApp:axeldibarra@gmail.com?secret=${promptConfig.qrSecret}&issuer=FestisApp`}
                    size={150}
                  />
                  <div className="w-full px-4 break-all text-[9.5px] text-slate-500 font-mono text-center select-all">
                    otpauth://totp/FestisApp:axeldibarra@gmail.com?secret=
                    {promptConfig.qrSecret}&issuer=FestisApp
                  </div>
                </div>
              )}
              <input
                type={promptConfig.inputType || "text"}
                className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-pink-500 font-bold text-sm text-slate-700 bg-slate-50"
                value={promptConfig.value}
                autoFocus
                onChange={(e) =>
                  setPromptConfig({ ...promptConfig, value: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const cb = promptConfig.onSubmit;
                    const val = promptConfig.value;
                    setPromptConfig(null);
                    setTimeout(() => cb(val), 10);
                  }
                }}
              />
              <div className="flex gap-2 justify-end mt-4">
                <button
                  id="btn-auto-39"
                  onClick={() => setPromptConfig(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  id="btn-auto-40"
                  onClick={() => {
                    const cb = promptConfig.onSubmit;
                    const val = promptConfig.value;
                    setPromptConfig(null);
                    setTimeout(() => cb(val), 10);
                  }}
                  className="px-6 py-2 bg-[#e91e63] text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-200"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {confirmConfig && confirmConfig.isOpen && (
          <motion.div
            key="global-confirm-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#e91e63]/40 backdrop-blur-sm flex items-center justify-center z-[150] p-4"
          >
            <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
              <h3 className="text-sm font-bold text-slate-800">
                {confirmConfig.title}
              </h3>
              {confirmConfig.errorCode && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative group text-left">
                  <p className="text-[10px] font-mono text-slate-500 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {confirmConfig.errorCode}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${confirmConfig.title}\n${confirmConfig.errorCode || ""}`,
                      );
                      showAlert("Código de error copiado al portapapeles");
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white shadow-sm rounded-lg text-slate-600 hover:text-slate-900 transition-colors opacity-100"
                    title="Copiar código de error"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-2 mt-6">
                <button
                  id="btn-auto-41"
                  onClick={() => {
                    confirmConfig.onConfirm();
                    setConfirmConfig(null);
                  }}
                  className="w-full py-3 bg-[#e91e63] text-white rounded-xl text-xs font-bold shadow-xl"
                >
                  {confirmConfig.isAlert
                    ? "Entendido"
                    : confirmConfig.confirmText || "Confirmar"}
                </button>
                {!confirmConfig.isAlert && (
                  <button
                    id="btn-auto-42"
                    onClick={() => setConfirmConfig(null)}
                    className="w-full py-3 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 rounded-xl"
                  >
                    {confirmConfig.cancelText || "Cancelar"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenedor de Modales Globales */}
      <GlobalModals
        isReminderModalOpen={isReminderModalOpen}
        setIsReminderModalOpen={setIsReminderModalOpen}
        editingReminder={editingReminder}
        setEditingReminder={setEditingReminder}
        addReminder={addReminder}
        updateReminder={updateReminder}
        festivals={festivals}
        selectedCalendarDate={selectedCalendarDate}
        userEmail={userEmail}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        modalType={modalType}
        selectedFestival={selectedFestival}
        userName={userName}
        isAuthorized={isAuthorized}
        isDev={isDev}
        setFestivals={setFestivals}
        setSelectedFestival={setSelectedFestival}
        addAuditLog={addAuditLog}
        showAlert={showAlert}
        platforms={platforms}
        distributionPlans={distributionPlans}
      />
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key={`global-toast-${toastMessage}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-0 right-0 flex justify-center z-[200] pointer-events-none"
          >
            <div className="bg-slate-900 border border-slate-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-semibold text-xs pointer-events-auto">
              <AlertCircle className="h-4 w-4 text-[#e91e63]" />
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {localDevSettings.showFirebaseStats && (
        <FirestoreDebugger showAlert={showToast} isDev={isDev} />
      )}
      <div className="fixed bottom-6 left-6 z-[200] flex flex-col gap-3 max-w-sm pointer-events-none">
        <AnimatePresence>
          {alerts.map((alert, idx) => (
            <motion.div
              key={`${alert.id}-${idx}`}
              initial={{ opacity: 0, x: -50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.9 }}
              className="bg-white border-l-4 border-l-[#e91e63] shadow-2xl rounded-xl p-4 flex flex-col gap-2 pointer-events-auto overflow-hidden relative"
            >
              <button
                onClick={() => removeAlert(alert.id)}
                className="absolute top-2 right-2 text-slate-600 hover:text-slate-900 transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
              <h4 className="text-xs font-bold text-slate-800 pr-6">
                {alert.title}
              </h4>
              {alert.errorCode && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 max-h-32 overflow-y-auto relative group flex gap-2">
                  <div className="flex-1 min-w-0">
                    {(() => {
                      try {
                        const parsed = JSON.parse(alert.errorCode);
                        if (parsed && typeof parsed === "object") {
                          const errorMsg = parsed.error || "Error desconocido";
                          const op = parsed.operationType ? `Operación: ${parsed.operationType}` : "";
                          const path = parsed.path ? `Ruta: ${parsed.path}` : "";
                          const details = [op, path].filter(Boolean).join(" | ");
                          return (
                            <div className="flex flex-col gap-1">
                              <p className="text-[11px] font-bold text-red-600 break-words leading-tight">
                                {errorMsg}
                              </p>
                              {details && (
                                <p className="text-[9px] text-slate-500 font-mono tracking-tight leading-normal">
                                  {details}
                                </p>
                              )}
                            </div>
                          );
                        }
                      } catch (e) {
                        // fallback to displaying raw string
                      }
                      return (
                        <p className="text-[10px] text-slate-500 font-mono break-words whitespace-pre-wrap leading-tight">
                          {alert.errorCode}
                        </p>
                      );
                    })()}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${alert.title}\n${alert.errorCode || ""}`,
                      );
                      showToast("Anotado en el portapapeles ✅");
                    }}
                    className="shrink-0 h-6 w-6 flex items-center justify-center bg-white border border-slate-200 rounded text-slate-600 hover:text-indigo-600 hover:border-indigo-600 transition shadow-sm opacity-100 self-start"
                    title="Copiar al portapapeles"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              )}
              {alert.errorCode && (
                <button
                  onClick={() => handleReportBug(alert)}
                  className="mt-2 text-xs font-semibold text-[#e91e63] bg-pink-50 hover:bg-pink-100 transition-colors py-2 px-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <Bug className="h-3.5 w-3.5" /> Reportar en Tracker
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <OmniboxModal
        isOpen={isOmniboxOpen}
        onClose={() => setIsOmniboxOpen(false)}
        festivals={festivals}
        reminders={reminders}
        setView={(v) => setView(v as any)}
        setSelectedFestival={setSelectedFestival}
      />
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          logout();
        }}
      />
      {localDevSettings.showConsole && <DebugConsole />}
      {localDevSettings.showKeyInspector && (
        <KeyDuplicatesInspector showToast={showToast} />
      )}
    </div>
  );
}
