import React, { useState, useEffect } from "react";
import { cn } from "../utils/helpers";
import { APP_VERSION } from "../version";
import {
  Lock,
  MonitorPlay,
  Settings,
  Users,
  Mail,
  Database,
  Building,
  Download,
  Upload,
  BarChart3,
  ClipboardList,
  FileText,
  Search,
  Edit2,
  Trash2,
  X,
  Plus,
  Globe,
  Award,
  Home,
  Github,
  Activity,
  AlertCircle,
  Copy,
  Bell,
  Zap,
  ChevronRight,
  Bug,
  Sparkles,
  Calendar,
  Clock,
  Moon,
  Save,
  Check,
  ExternalLink,
  AlertTriangle,
  BookOpen,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  Smartphone,
  CheckCircle,
  RefreshCw,
  Palette,
} from "lucide-react";
import { useSkin } from "../context/SkinContext";
import {
  AppMember,
  AuditLog,
  BugTicket,
  Festival,
  RoadmapItem,
  FestivalStatus,
  Platform,
  UserNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DistributionInstitution,
  DistributionPlan,
} from "../types";
import type { Notification as AppNotification } from "../types";
import { INITIAL_FESTIVALS, INITIAL_PLATFORMS } from "../utils/seedData";
import { format, parseISO } from "date-fns";
import { authenticator } from "@otplib/preset-browser";
import {
  getFirestoreReads,
  resetFirestoreReads,
  getFirestoreWrites,
  resetFirestoreWrites,
} from "../utils/readCounters";
import { db, messagingPromise } from "../firebase";
import { motion, AnimatePresence } from "motion/react";
import { OceanShader } from "./OceanShader";
import { ShaderConfigGroup } from "./ShaderConfigGroup";
import { PlatformIcon } from "./PlatformIcon";
import { ProjectConfigPanel } from "./ProjectConfigPanel";

interface ConfigViewProps {
  configTab: "general" | "services" | "members" | "database" | "visuals" | "info" | "desarrollo" | "proyecto";
  setConfigTab: (
    tab: "general" | "services" | "members" | "database" | "visuals" | "info" | "desarrollo" | "proyecto",
  ) => void;
  userEmail: string;
  userName: string;
  isDebugMode: boolean;
  setIsDebugMode: (val: boolean) => void;
  twoFactorSecret: string | null;
  setTwoFactorSecret: (val: string) => void;
  showAlert: (title: string, errorCode?: string) => void;
  setPromptConfig: (config: any) => void;
  isAuthorized: boolean;
  logout: () => void;
  isDesaturated: boolean;
  setIsDesaturated: (val: boolean) => void;
  usePaperShader: boolean;
  setUsePaperShader: (val: boolean) => void;
  paperOpacity: number;
  setPaperOpacity: (val: number) => void;
  paperBlendMode: string;
  setPaperBlendMode: (val: string) => void;
  useCmykShader: boolean;
  setUseCmykShader: (val: boolean) => void;
  cmykOpacity: number;
  setCmykOpacity: (val: number) => void;
  cmykBlendMode: string;
  setCmykBlendMode: (val: string) => void;
  useGrainShader: boolean;
  setUseGrainShader: (val: boolean) => void;
  grainOpacity: number;
  setGrainOpacity: (val: number) => void;
  grainBlendMode: string;
  setGrainBlendMode: (val: string) => void;
  paperParams: Record<string, number>;
  cmykParams: Record<string, number>;
  grainParams: Record<string, number>;
  updatePaperParam: (k: string, v: number) => void;
  updateCmykParam: (k: string, v: number) => void;
  updateGrainParam: (k: string, v: number) => void;
  realIsDev: boolean;
  testRole: string | null;
  setTestRole: (role: string | null) => void;
  effectiveRole: string;
  devSettings: any;
  setDevSettings: (fn: any) => void;
  setEasterEggUnlocked: (val: boolean) => void;
  members: AppMember[];
  setMembers: (members: any) => void;
  isAdmin: boolean;
  addAuditLog: (col: string, details: string) => void;
  setConfirmConfig: (config: any) => void;
  festivals: Festival[];
  setFestivals: (festivals: Festival[]) => void;
  setIsExcelModalOpen: (val: boolean) => void;
  setExcelImportStats: (stats: any) => void;
  handleMigrateToCloud: () => void;
  migrateOldCollection: (col: string) => void;
  exportDB: () => void;
  exportDBExcel: () => void;
  importDB: (e: any) => void;
  downloadCollection: (name: string, data: any) => void;
  notifications: AppNotification[];
  bugs: BugTicket[];
  roadmap: RoadmapItem[];
  filmData: any[];
  auditLogs: AuditLog[];
  notes?: any[];
  socialPosts?: any[];
  reminders?: any[];
  gallery?: any[];
  auditSearchTerm: string;
  setAuditSearchTerm: (term: string) => void;
  handleExportAuditPDF: () => void;
  setNotifications: (n: any) => void;
  setAuditLogs: (a: any) => void;
  setNotes: (n: any) => void;
  setBugs: (b: any) => void;
  setRoadmap: (r: any) => void;
  setFilmData: (f: any) => void;
  localDevSettings: {
    showConsole: boolean;
    showFirebaseStats: boolean;
    showToasts: boolean;
    experimentalFeatures: boolean;
    showKeyInspector?: boolean;
  };
  setLocalDevSettings: React.Dispatch<
    React.SetStateAction<{
      showConsole: boolean;
      showFirebaseStats: boolean;
      showToasts: boolean;
      experimentalFeatures: boolean;
      showKeyInspector?: boolean;
    }>
  >;
  setView?: (view: any) => void;
  platforms?: Platform[];
  setPlatforms?: any;
  institutions?: DistributionInstitution[];
  setInstitutions?: (institutions: any) => void;
  distributionPlans?: DistributionPlan[];
}

export const ConfigView: React.FC<ConfigViewProps> = ({
  configTab,
  setConfigTab,
  userEmail,
  userName,
  isDebugMode,
  setIsDebugMode,
  twoFactorSecret,
  setTwoFactorSecret,
  showAlert,
  setPromptConfig,
  isAuthorized,
  logout,
  isDesaturated,
  setIsDesaturated,
  usePaperShader,
  setUsePaperShader,
  paperOpacity,
  setPaperOpacity,
  paperBlendMode,
  setPaperBlendMode,
  useCmykShader,
  setUseCmykShader,
  cmykOpacity,
  setCmykOpacity,
  cmykBlendMode,
  setCmykBlendMode,
  useGrainShader,
  setUseGrainShader,
  grainOpacity,
  setGrainOpacity,
  grainBlendMode,
  setGrainBlendMode,
  paperParams,
  cmykParams,
  grainParams,
  updatePaperParam,
  updateCmykParam,
  updateGrainParam,
  realIsDev,
  testRole,
  setTestRole,
  effectiveRole,
  devSettings,
  setDevSettings,
  setEasterEggUnlocked,
  members,
  setMembers,
  isAdmin,
  addAuditLog,
  setConfirmConfig,
  festivals,
  setFestivals,
  setIsExcelModalOpen,
  setExcelImportStats,
  handleMigrateToCloud,
  migrateOldCollection,
  exportDB,
  exportDBExcel,
  importDB,
  downloadCollection,
  notifications,
  bugs,
  roadmap,
  filmData,
  auditLogs,
  notes = [],
  socialPosts = [],
  reminders = [],
  gallery = [],
  platforms = [],
  setPlatforms,
  institutions = [],
  setInstitutions,
  distributionPlans = [],
  auditSearchTerm,
  setAuditSearchTerm,
  handleExportAuditPDF,
  setNotifications,
  setAuditLogs,
  setNotes,
  setBugs,
  setRoadmap,
  setFilmData,
  localDevSettings,
  setLocalDevSettings,
  setView,
}) => {
  const { activeSkin, setActiveSkin, skins } = useSkin();
  const [reads, setReads] = useState(getFirestoreReads());
  const [writes, setWrites] = useState(getFirestoreWrites());
  const [migrationStatus, setMigrationStatus] = useState<{
    status: "loading" | "success" | "error";
    message: string;
    details?: string;
  } | null>(null);
  const [configClicks, setConfigClicks] = useState(0);
  const [versionClicks, setVersionClicks] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [showOceanShader, setShowOceanShader] = useState(false);
  const [forceError, setForceError] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState("");
  const [newPlatformIcon, setNewPlatformIcon] = useState("Award");
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);

  // Estados para instituciones reguladoras
  const [isInstitutionModalOpen, setIsInstitutionModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<DistributionInstitution | null>(null);
  const [instNombre, setInstNombre] = useState("");
  const [instEmail, setInstEmail] = useState("");
  const [instResponsable, setInstResponsable] = useState("");
  const [instNotas, setInstNotas] = useState("");
  const [isSavingInstitution, setIsSavingInstitution] = useState(false);

  // Precarga automática de ENERC
  useEffect(() => {
    if (institutions && institutions.length === 0 && setInstitutions) {
      const defaultInstitution: DistributionInstitution = {
        id: "enerc-default",
        nombre: "ENERC",
        emailContacto: "enerc@enerc.gob.ar",
        responsable: "Rectorado / Coordinación de Festivales",
        notas: "Escuela Nacional de Experimentación y Realización Cinematográfica. Institución cinematográfica oficial en Argentina.",
        fechaCreacion: new Date().toISOString()
      };
      setInstitutions([defaultInstitution]);
    }
  }, [institutions, setInstitutions]);

  const handleOpenAddInstitution = () => {
    setEditingInst(null);
    setInstNombre("");
    setInstEmail("");
    setInstResponsable("");
    setInstNotas("");
    setIsInstitutionModalOpen(true);
  };

  const handleOpenEditInstitution = (inst: DistributionInstitution) => {
    setEditingInst(inst);
    setInstNombre(inst.nombre);
    setInstEmail(inst.emailContacto || "");
    setInstResponsable(inst.responsable || "");
    setInstNotas(inst.notas || "");
    setIsInstitutionModalOpen(true);
  };

  const handleSaveInstitution = async () => {
    if (!instNombre.trim()) {
      showAlert("Validación", "El nombre de la institución es obligatorio.");
      return;
    }
    setIsSavingInstitution(true);
    try {
      if (editingInst) {
        const updated = institutions.map(i => i.id === editingInst.id ? {
          ...i,
          nombre: instNombre,
          emailContacto: instEmail,
          responsable: instResponsable,
          notas: instNotas
        } : i);
        if (setInstitutions) setInstitutions(updated);
        addAuditLog?.("institutions", `Se actualizó la institución: ${instNombre}`);
      } else {
        const nueva: DistributionInstitution = {
          id: Date.now().toString(),
          nombre: instNombre,
          emailContacto: instEmail,
          responsable: instResponsable,
          notas: instNotas,
          fechaCreacion: new Date().toISOString()
        };
        if (setInstitutions) setInstitutions([...institutions, nueva]);
        addAuditLog?.("institutions", `Se registró la institución: ${instNombre}`);
      }
      setIsInstitutionModalOpen(false);
    } catch (e) {
      console.error(e);
      showAlert("Error", "No se pudo guardar la institución.");
    } finally {
      setIsSavingInstitution(false);
    }
  };

  const handleDeleteInstitution = (id: string, name: string) => {
    setConfirmConfig?.({
      isOpen: true,
      title: "¿Estás seguro de eliminar esta institución?",
      message: `Esta acción eliminará de forma permanente la institución '${name}'.`,
      onConfirm: () => {
        if (setInstitutions) {
          setInstitutions(institutions.filter(i => i.id !== id));
          addAuditLog?.("institutions", `Se eliminó la institución: ${name}`);
        }
      }
    });
  };
  const [isDesignShowcaseOpen, setIsDesignShowcaseOpen] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<UserNotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [isSavingNotifPrefs, setIsSavingNotifPrefs] = useState(false);
  const [hasSavedNotifPrefs, setHasSavedNotifPrefs] = useState(false);

  const [isGeminiSparkEnabled, setIsGeminiSparkEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("gemini_spark_enabled");
    return saved !== null ? saved === "true" : true;
  });

  const [sparkSecretKey, setSparkSecretKey] = useState<string>(() => {
    return localStorage.getItem("gemini_spark_secret_key") || "";
  });
  const [showSparkKey, setShowSparkKey] = useState<boolean>(false);
  const [isSavingSparkKey, setIsSavingSparkKey] = useState<boolean>(false);

  // Phone & 2FA Security Verification State
  const [userPhone, setUserPhone] = useState<string>(() => {
    return localStorage.getItem(`user_phone_${userEmail}`) || "";
  });
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  const [isExperimental2FAEnabled, setIsExperimental2FAEnabled] = useState<boolean>(() => {
    return localStorage.getItem("experimental_2fa_enabled") === "true";
  });

  const toggleExperimental2FA = (val: boolean) => {
    setIsExperimental2FAEnabled(val);
    localStorage.setItem("experimental_2fa_enabled", val ? "true" : "false");
    showAlert("Funciones Experimentales", `Seguridad 2FA para Spark ${val ? "habilitada" : "deshabilitada"}.`);
  };

  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [twoFactorActionTitle, setTwoFactorActionTitle] = useState("");
  const [pending2FAAction, setPending2FAAction] = useState<(() => void) | null>(null);
  const [twoFactorInputCode, setTwoFactorInputCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  const [recoveryOtpCode, setRecoveryOtpCode] = useState<string | null>(null);
  const [isRecoverySent, setIsRecoverySent] = useState(false);
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);

  const request2FA = (actionTitle: string, actionCallback: () => void) => {
    setTwoFactorActionTitle(actionTitle);
    setPending2FAAction(() => actionCallback);
    setTwoFactorInputCode("");
    setTwoFactorError(null);
    setRecoveryOtpCode(null);
    setIsRecoverySent(false);
    setIs2FAModalOpen(true);
  };

  const open2FASetupModal = () => {
    const secret = authenticator.generateSecret();
    setPromptConfig({
      isOpen: true,
      title: "Configurar 2FA (Escanea el QR e ingresa el código):",
      value: "",
      inputType: "text",
      qrSecret: secret,
      onSubmit: (val: string) => {
        if (authenticator.check(val, secret)) {
          setTwoFactorSecret(secret);
          showAlert(
            "2FA Configurado Exitosamente",
            "Su aplicación autenticadora (Google Authenticator / Authy) ha sido vinculada correctamente a su cuenta."
          );
          if (addAuditLog) {
            addAuditLog(
              "CONFIGURACION_2FA_ACTUALIZADA",
              `2FA activado/actualizado para ${userEmail}`
            );
          }
        } else {
          showAlert("Código Incorrecto", "El código ingresado no coincide con el generador TOTP.");
        }
      },
    });
  };

  const handleSendRecoveryCode = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setIsSendingRecovery(true);
    setTwoFactorError(null);

    const phoneText = userPhone.trim() ? userPhone.trim() : "";

    try {
      const resp = await fetch("/api/send-2fa-recovery-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          phone: phoneText,
          code
        })
      });
      const data = await resp.json();

      if (data.success) {
        setRecoveryOtpCode(code);
        setIsRecoverySent(true);
        showAlert(
          "Código Enviado por Email & SMS",
          `Se ha enviado el código de verificación de 6 dígitos.\n• Email: ${userEmail}\n• Celular / SMS: ${phoneText || "Sin celular registrado"}\n\nCódigo (Entorno Preview): ${code}`
        );
        if (addAuditLog) {
          addAuditLog("RECUPERACION_2FA_SOLICITADA", `Código OTP enviado a ${userEmail} y ${phoneText || "móvil"}`);
        }
      } else {
        setTwoFactorError(`Error al enviar código: ${data.error || "Fallo en el servidor"}`);
      }
    } catch (e: any) {
      setTwoFactorError(`No se pudo conectar con el servidor de autenticación: ${e.message}`);
    } finally {
      setIsSendingRecovery(false);
    }
  };

  const handleVerify2FA = () => {
    const cleanInput = twoFactorInputCode.trim();
    let isValid = false;

    // Check TOTP Authenticator code if secret is set
    if (twoFactorSecret) {
      try {
        authenticator.options = { window: 1 };
        isValid = authenticator.check(cleanInput, twoFactorSecret);
      } catch (err) {
        console.error("Error al verificar el código TOTP con otplib:", err);
      }
    }

    // Check Recovery OTP Code (Email & SMS) if active
    if (!isValid && recoveryOtpCode && cleanInput === recoveryOtpCode) {
      isValid = true;
    }

    if (isValid) {
      setIs2FAModalOpen(false);
      setTwoFactorError(null);
      setRecoveryOtpCode(null);
      setIsRecoverySent(false);
      if (pending2FAAction) {
        pending2FAAction();
        setPending2FAAction(null);
      }
    } else {
      if (!twoFactorSecret && !recoveryOtpCode) {
        setTwoFactorError("No has configurado 2FA aún. Haz clic en 'Enviar código por Email & SMS' para recuperar tu acceso.");
      } else {
        setTwoFactorError("Código de 6 dígitos incorrecto.");
      }
    }
  };

  const handleToggleShowSparkKey = () => {
    if (showSparkKey) {
      setShowSparkKey(false);
    } else if (isExperimental2FAEnabled && twoFactorSecret) {
      request2FA("Revelar Clave Secreta API Key", () => setShowSparkKey(true));
    } else {
      setShowSparkKey(true);
    }
  };

  const handleGenerateRandomSparkKeyWith2FA = () => {
    if (isExperimental2FAEnabled && twoFactorSecret) {
      request2FA("Generar Nueva Clave Secreta", () => handleGenerateRandomSparkKey());
    } else {
      handleGenerateRandomSparkKey();
    }
  };

  const handleSaveSparkSecretKeyWith2FA = () => {
    if (isExperimental2FAEnabled && twoFactorSecret) {
      request2FA("Guardar Clave Secreta API Key", () => handleSaveSparkSecretKey(sparkSecretKey));
    } else {
      handleSaveSparkSecretKey(sparkSecretKey);
    }
  };

  const handleSaveSparkSecretKey = async (newKey: string) => {
    setSparkSecretKey(newKey);
    localStorage.setItem("gemini_spark_secret_key", newKey);
    setIsSavingSparkKey(true);
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const sparkRef = doc(db, "system_settings", "gemini_spark");
      await setDoc(
        sparkRef,
        {
          apiKey: newKey,
          updatedAt: new Date().toISOString(),
          updatedBy: userEmail || "system",
        },
        { merge: true }
      );
      addAuditLog(
        "system_settings",
        `${userName || userEmail} ha actualizado la API Key secreta de Gemini Spark.`
      );
      showAlert("Clave Secreta Guardada", "La API Key de autenticación para Gemini Spark se guardó correctamente.");
    } catch (err) {
      console.warn("Error guardando clave secreta en Firestore:", err);
    } finally {
      setIsSavingSparkKey(false);
    }
  };

  const handleGenerateRandomSparkKey = () => {
    const generated = "spark_" + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    handleSaveSparkSecretKey(generated);
  };

  const handleToggleGeminiSpark = async (val: boolean) => {
    setIsGeminiSparkEnabled(val);
    localStorage.setItem("gemini_spark_enabled", val ? "true" : "false");
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const sparkRef = doc(db, "system_settings", "gemini_spark");
      await setDoc(
        sparkRef,
        {
          enabled: val,
          mode: "read-only",
          updatedAt: new Date().toISOString(),
          updatedBy: userEmail || "system",
        },
        { merge: true }
      );
      addAuditLog(
        "system_settings",
        `${userName || userEmail} ha ${val ? "activado" : "desactivado"} la integración backend Gemini Spark (Modo Lectura).`
      );
      showAlert("Gemini Spark", `Integración backend en modo lectura ${val ? "habilitada" : "deshabilitada"}.`);
    } catch (err) {
      console.warn("Error sincronizando Gemini Spark setting en Firestore:", err);
    }
  };

  const renderSwitch = (
    checked: boolean,
    onChange: (val: boolean) => void,
    activeBgClass: string = "bg-indigo-600"
  ) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? activeBgClass : "bg-slate-200"
      }`}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0"
        style={{
          transform: checked ? "translateX(20px)" : "translateX(0px)",
          transition: "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </button>
  );

  useEffect(() => {
    if (!userEmail) return;
    let isMounted = true;
    const loadPrefsFromDB = async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const docRef = doc(db, "user_notif_prefs", userEmail);
        const snap = await getDoc(docRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          if (data && data.preferences) {
            setNotifPrefs({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...data.preferences });
          }
        }
      } catch (e) {
        console.warn("Error cargando preferencias de notificaciones desde BD:", e);
      }
    };
    loadPrefsFromDB();
    return () => { isMounted = false; };
  }, [userEmail]);

  const saveNotifPrefs = async (updated: UserNotificationPreferences) => {
    setNotifPrefs(updated);
    if (!userEmail) {
      showAlert("Error", "Debes estar autenticado para guardar en la base de datos.");
      return;
    }
    setIsSavingNotifPrefs(true);
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const docRef = doc(db, "user_notif_prefs", userEmail);
      await setDoc(
        docRef,
        {
          email: userEmail,
          preferences: updated,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setHasSavedNotifPrefs(true);
      setTimeout(() => {
        setHasSavedNotifPrefs(false);
      }, 2500);
    } catch (e) {
      console.error("Error guardando preferencias en Firestore:", e);
      showAlert("Error al guardar", "No se pudieron guardar las preferencias en la base de datos.");
    } finally {
      setIsSavingNotifPrefs(false);
    }
  };

  const [aiConfig, setAiConfig] = useState({
    genre: "Cortometraje Animación",
    maxDuration: 15,
    maxPrice: 10,
    originCountry: "Argentina",
    enabled: true
  });

  useEffect(() => {
    const saved = localStorage.getItem("aiSearchConfig");
    if (saved) {
      try {
        setAiConfig(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveAiConfig = (newConfig: any) => {
    setAiConfig(newConfig);
    localStorage.setItem("aiSearchConfig", JSON.stringify(newConfig));
  };

  const handleAddPlatform = () => {
    if (!newPlatformName.trim()) {
      showAlert("Error", "El nombre de la plataforma no puede estar vacío.");
      return;
    }
    const exists = platforms.some(
      (p) => p.name.toLowerCase() === newPlatformName.trim().toLowerCase()
    );
    if (exists) {
      showAlert("Error", "Esta plataforma ya está registrada.");
      return;
    }
    const newPlatform: Platform = {
      id: Date.now().toString(),
      name: newPlatformName.trim(),
      icon: newPlatformIcon,
    };
    setPlatforms((prev: Platform[]) => [...prev, newPlatform]);
    setNewPlatformName("");
    setNewPlatformIcon("Award");
    setIsPlatformModalOpen(false);
    addAuditLog(
      "platforms",
      `${userName || userEmail} ha registrado la plataforma de envío '${newPlatform.name}'.`
    );
    showAlert("Éxito", `Plataforma "${newPlatform.name}" registrada correctamente.`);
  };

  const handleDeletePlatform = (id: string, name: string) => {
    if (INITIAL_PLATFORMS.some(ip => ip.id === id || ip.name.toLowerCase().trim() === name.toLowerCase().trim())) {
      showAlert("Error", "No se puede eliminar una plataforma predeterminada del sistema.");
      return;
    }

    // Contar festivales asociados a esta plataforma
    const associatedCount = festivals.filter(
      (f) => f.platform && f.platform.toLowerCase().trim() === name.toLowerCase().trim()
    ).length;

    const hasAssociations = associatedCount > 0;
    const confirmTitle = hasAssociations
      ? `¡Atención! Hay ${associatedCount} festival(es) actualmente asociado(s) a "${name}". Si la eliminas, se desvinculará de ellos. ¿Quieres proceder?`
      : `¿Estás seguro de que quieres eliminar la plataforma "${name}"?`;

    setConfirmConfig({
      isOpen: true,
      title: confirmTitle,
      confirmText: hasAssociations ? "Eliminar y Desvincular" : "Eliminar",
      cancelText: "Cancelar",
      onConfirm: () => {
        // Eliminar la plataforma
        setPlatforms((prev: Platform[]) => prev.filter((p) => p.id !== id));

        // Desvincular de los festivales asociados
        if (hasAssociations) {
          const updatedFestivals = festivals.map((f) => {
            if (f.platform && f.platform.toLowerCase().trim() === name.toLowerCase().trim()) {
              return { ...f, platform: "" };
            }
            return f;
          });
          setFestivals(updatedFestivals);
        }

        addAuditLog(
          "platforms",
          `${userName || userEmail} ha eliminado la plataforma de envío '${name}'${hasAssociations ? ` desvinculando ${associatedCount} festival(es)` : ""}.`
        );
        showAlert("Éxito", "Plataforma eliminada correctamente.");
      },
    });
  };

  if (forceError) {
    throw new Error("Simulación de error en la renderización de la vista.");
  }

  useEffect(() => {
    const handleReadSync = (e: any) => setReads(e.detail?.total ?? e.detail);
    const handleWriteSync = (e: any) => setWrites(e.detail?.total ?? e.detail);
    window.addEventListener("firestoreReadSync", handleReadSync);
    window.addEventListener("firestoreWriteSync", handleWriteSync);
    return () => {
      window.removeEventListener("firestoreReadSync", handleReadSync);
      window.removeEventListener("firestoreWriteSync", handleWriteSync);
    };
  }, []);

  const isLocalMode = localStorage.getItem("__localMode") === "true";
  const toggleLocalMode = () => {
    if (isLocalMode) {
      setConfirmConfig({
        isOpen: true,
        title:
          "¿Estás segurx? Al desactivar el Entorno de Pruebas Aislado, los cambios realizados NO se sincronizarán en la base de datos.",
        confirmText: "Entiendo",
        cancelText: "No",
        onConfirm: () => {
          localStorage.setItem("__localMode", "false");
          window.location.reload();
        },
      });
    } else {
      localStorage.setItem("__localMode", "true");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 pb-32 pt-6 relative">
      <AnimatePresence>
        {showOceanShader && (
          <OceanShader key="ocean-shader-modal" onClose={() => setShowOceanShader(false)} />
        )}
        {isExploding && (
          <motion.div
            key="secret-explosion-overlay"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="absolute inset-0 bg-[#e91e63]/10 animate-pulse" />
            <h1 className="text-4xl md:text-6xl font-black text-[#e91e63] uppercase tracking-tighter drop-shadow-md z-10">
              Se ha revelado un secreto
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest mt-4 z-10 text-xs md:text-sm">
              en algun lado
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {migrationStatus && (
        <div
          className={`fixed bottom-6 right-6 z-[250] px-4 py-3 rounded-2xl shadow-xl flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 max-w-sm ${migrationStatus.status === "error" ? "bg-red-600 text-white" : migrationStatus.status === "success" ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"}`}
        >
          <div className="flex items-center gap-3">
            {migrationStatus.status === "loading" && (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {migrationStatus.status === "success" && (
              <div className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                ✓
              </div>
            )}
            {migrationStatus.status === "error" && (
              <AlertCircle className="h-4 w-4" />
            )}
            <p className="text-xs font-bold tracking-wider">
              {migrationStatus.message}
            </p>
            <button
              onClick={() => setMigrationStatus(null)}
              className="ml-auto opacity-70 hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          {migrationStatus.details && (
            <div className="bg-black/20 p-2 rounded relative group flex gap-2 overflow-hidden items-start">
              <p className="text-[10px] font-mono break-words whitespace-pre-wrap flex-1 opacity-80 max-h-24 overflow-y-auto">
                {migrationStatus.details}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${migrationStatus.message}\n${migrationStatus.details || ""}`,
                  );
                  showAlert("Copiado", "Detalles copiados al portapapeles");
                }}
                className="shrink-0 h-6 w-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded transition opacity-100"
                title="Copiar detalles"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      <header className="flex flex-col gap-1">
        <h2
          className={cn(
            "text-4xl font-black tracking-tighter uppercase select-none transition-all duration-300",
            configClicks >= 3
              ? "text-[#e91e63] animate-bounce drop-shadow-[0_0_15px_rgba(233,30,99,0.8)] cursor-pointer"
              : "text-slate-800",
          )}
          onClick={() => {
            setConfigClicks((prev) => {
              const nextVal = prev + 1;
              if (nextVal >= 3) {
                setIsExploding(true);
                setEasterEggUnlocked(true);
                showAlert("¡Se ha desbloqueado la Taza 3D en la PlayZone! 🏆");
                setTimeout(() => {
                  setIsExploding(false);
                }, 4000);
              }
              return nextVal;
            });
          }}
        >
          CONFIG
          <span
            className={configClicks >= 3 ? "text-white" : "text-[#e91e63]"}
          >
            URACIÓN
          </span>
        </h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
          Gestión de accesos y base de datos
        </p>
      </header>

      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl max-w-[650px]">
        <button
          id="btn-config-proyecto"
          className={cn(
            "flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all",
            configTab === "proyecto"
              ? "bg-white text-pink-600 shadow shadow-pink-200/50"
              : "text-slate-400 hover:text-slate-600",
          )}
          onClick={() => setConfigTab("proyecto")}
        >
          Proyecto
        </button>
        <button
          id="btn-config-general"
          className={cn(
            "flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all",
            configTab === "general"
              ? "bg-white text-slate-800 shadow shadow-slate-200/50"
              : "text-slate-400 hover:text-slate-600",
          )}
          onClick={() => setConfigTab("general")}
        >
          General
        </button>
        <button
          id="btn-config-services"
          className={cn(
            "flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all",
            configTab === "services"
              ? "bg-white text-amber-600 shadow shadow-amber-200/50"
              : "text-slate-400 hover:text-slate-600",
          )}
          onClick={() => setConfigTab("services")}
        >
          Servicios
        </button>
        <button
          id="btn-config-members"
          className={cn(
            "flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all",
            configTab === "members"
              ? "bg-white text-indigo-500 shadow shadow-indigo-200/50"
              : "text-slate-400 hover:text-slate-600",
          )}
          onClick={() => setConfigTab("members")}
        >
          Miembros
        </button>
        <button
          id="btn-config-database"
          className={cn(
            "flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all",
            configTab === "database"
              ? "bg-white text-emerald-500 shadow shadow-emerald-200/50"
              : "text-slate-400 hover:text-slate-600",
          )}
          onClick={() => setConfigTab("database")}
        >
          DB
        </button>
        <button
          id="btn-config-visuals"
          className={cn(
            "flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all",
            configTab === "visuals"
              ? "bg-white text-rose-500 shadow shadow-rose-200/50"
              : "text-slate-400 hover:text-slate-600",
          )}
          onClick={() => setConfigTab("visuals")}
        >
          Visuales
        </button>
        <button
          id="btn-config-info"
          className={cn(
            "flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all",
            configTab === "info"
              ? "bg-white text-blue-500 shadow shadow-blue-200/50"
              : "text-slate-400 hover:text-slate-600",
          )}
          onClick={() => setConfigTab("info")}
        >
          INFO
        </button>
        {effectiveRole === "dev" && (
          <button
            id="btn-config-desarrollo"
            className={cn(
              "flex-1 px-2 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all",
              configTab === "desarrollo"
                ? "bg-white text-amber-500 shadow shadow-amber-200/50"
                : "text-slate-400 hover:text-slate-600",
            )}
            onClick={() => setConfigTab("desarrollo")}
          >
            DEV
          </button>
        )}
      </div>

      {configTab === "proyecto" && (
        <ProjectConfigPanel />
      )}

      {configTab === "general" && (
        <div className="space-y-8">
          {/* Selector de Temas */}
          <div className="glass-card p-6 space-y-4 border-l-4 border-l-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-800 text-white">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                    Temas
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Personaliza la apariencia visual del sistema.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setView?.("theme_showcase")}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Abrir laboratorio de diseño y maqueta a pantalla completa"
              >
                <Eye className="h-3.5 w-3.5 text-pink-500" />
                <span>Laboratorio UI</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {skins.map((skin) => {
                const isSelected = activeSkin === skin.id;
                return (
                  <button
                    key={skin.id}
                    type="button"
                    onClick={() => {
                      setActiveSkin(skin.id);
                      if (addAuditLog) {
                        addAuditLog(
                          "USER_SKIN_UPDATED",
                          `Tema cambiado a '${skin.name}'`
                        );
                      }
                    }}
                    className={cn(
                      "flex flex-col text-left p-4 rounded-2xl border-2 transition-all relative overflow-hidden group cursor-pointer",
                      isSelected
                        ? "border-[#e91e63] bg-white/80 shadow-md scale-[1.02]"
                        : "border-slate-200/80 bg-white/40 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        {skin.name}
                      </span>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-[#e91e63] text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    {skin.badge && (
                      <span className="self-start mb-3 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                        {skin.badge}
                      </span>
                    )}
                    {skin.previewColors && skin.previewColors.length > 0 && (
                      <div className="flex items-center gap-2 mt-auto pt-1">
                        {skin.previewColors.map((color, idx) => (
                          <div
                            key={idx}
                            className="h-5 w-5 rounded-full border border-black/15 shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-6 space-y-4 border-l-4 border-l-slate-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <Lock className="h-4 w-4" /> Autenticado con Google
            </h3>
            <div className="space-y-2">
              <input
                type="email"
                value={userEmail}
                readOnly
                className="glass-input w-full bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                {isAuthorized
                  ? "✅ Email Autorizado"
                  : "❌ Email No Autorizado (Modo Lectura)"}
              </p>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={logout}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border bg-red-50 text-red-500 border-red-100 hover:bg-red-100"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>

          {/* Sección Unificada: Notificaciones */}
          <div className="glass-card p-6 space-y-6 border-l-4 border-l-indigo-500">
            {typeof window !== "undefined" && window.self !== window.top && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">Modo Vista Previa (iFrame)</p>
                    <p className="text-[10px] text-amber-700 font-medium">
                      Los navegadores bloquean los permisos Push dentro de un iframe. Para probar y activar notificaciones en este dispositivo, abre la app en una pestaña independiente.
                    </p>
                  </div>
                </div>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir en Nueva Pestaña
                </a>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    Notificaciones
                  </h3>
                </div>
              </div>

              {/* Botones de Acción directos */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    if ("Notification" in window) {
                      Notification.requestPermission().then(async (p) => {
                        if (p === "granted") {
                          showAlert(
                            "¡Notificaciones Activadas!",
                            "Registrando dispositivo...",
                          );
                          try {
                            let swRegistration: ServiceWorkerRegistration | undefined = undefined;
                            if ("serviceWorker" in navigator) {
                              try {
                                swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
                              } catch (swErr) {
                                console.warn("Error registrando Service Worker:", swErr);
                              }
                            }
                            const { doc, setDoc, arrayUnion } =
                              await import("firebase/firestore");
                            const { getToken, onMessage } =
                              await import("firebase/messaging");
                            const messaging = await messagingPromise;
                            if (messaging) {
                              onMessage(messaging, (payload) => {
                                console.log("FCM Foreground message received:", payload);
                                if ("Notification" in window && Notification.permission === "granted") {
                                  const title = payload.notification?.title || payload.data?.title || "Festis";
                                  const body = payload.notification?.body || payload.data?.body || "";
                                  if ("serviceWorker" in navigator) {
                                    navigator.serviceWorker.ready.then((reg) => {
                                      reg.showNotification(title, { body, icon: "/images/favicon.png" });
                                    });
                                  } else {
                                    new Notification(title, { body, icon: "/images/favicon.png" });
                                  }
                                }
                              });

                              const currentToken = await getToken(messaging, {
                                vapidKey:
                                  (import.meta as any).env.VITE_FCM_VAPID_KEY || "BKUk3pX41rOZG-K2O_yoblMNHZqG-3LfAfcJY5L7tkOGqX3zDF4foVtMZNfGuvcq5b8bNH-EEsF2B38dgextsSs",
                                serviceWorkerRegistration: swRegistration,
                              });
                              if (currentToken) {
                                const response = await fetch(
                                  "/api/save-fcm-token",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      email: userEmail,
                                      token: currentToken,
                                    }),
                                  },
                                );
                                const result = await response.json();
                                if (result.success) {
                                  showAlert(
                                    "¡Listo!",
                                    "Dispositivo registrado para recibir alertas.",
                                  );
                                } else {
                                  console.error("Error del API:", result.error);
                                  showAlert(
                                    "Error",
                                    "Falló el guardado del token en el servidor.",
                                  );
                                }
                              }
                            }
                          } catch (err: any) {
                            if (err?.code === 'messaging/token-subscribe-failed' || err?.message?.includes('Request is missing required authentication credential')) {
                                console.warn('⚠️ Push notifications skipped: Firebase FCM is not fully configured (missing valid VAPID setup).');
                                showAlert("Casi listo", "Las notificaciones locales funcionan bien en applet. Para push, falta credencial VAPID.");
                            } else {
                                console.error("Error registrando token FCM:", err);
                                showAlert("Error registrando token");
                            }
                          }
                        } else if (p === "denied") {
                          showAlert(
                            "Permiso Denegado",
                            "Debes habilitar notificaciones desde los ajustes de tu navegador o usar una nueva pestaña.",
                          );
                        }
                      });
                    }
                  }}
                  className="px-3.5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <Bell className="h-3.5 w-3.5" />
                  Activar Push
                </button>
                <button
                  onClick={async () => {
                    if (!("Notification" in window)) {
                      showAlert("No compatible", "Tu navegador no soporta notificaciones.");
                      return;
                    }
                    if (Notification.permission !== "granted") {
                      showAlert(
                        "Permisos Requeridos",
                        "Primero debes hacer clic en 'Activar Push' para permitir las notificaciones en tu navegador."
                      );
                      return;
                    }

                    // Direct system notification trigger
                    try {
                      if ("serviceWorker" in navigator) {
                        const reg = await navigator.serviceWorker.ready;
                        reg.showNotification("👋 ¡Hola desde Festis!", {
                          body: "Si ves este mensaje, las notificaciones push del sistema están funcionando perfectamente en tu dispositivo.",
                          icon: "/images/favicon.png",
                        });
                      } else {
                        new Notification("👋 ¡Hola desde Festis!", {
                          body: "Si ves este mensaje, las notificaciones push del sistema están funcionando perfectamente en tu dispositivo.",
                          icon: "/images/favicon.png",
                        });
                      }
                    } catch (e) {
                      console.warn("Error mostrando notificación local del sistema:", e);
                    }

                    showAlert("Enviando...", "Enviando señal de prueba...");
                    try {
                      const res = await fetch("/api/test-push", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: userEmail || "axeldibarra@gmail.com",
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        showAlert("Test Enviado", "Notificación del sistema activada en tu pantalla.");
                      } else {
                        showAlert(
                          "Test Enviado",
                          "Se envió la notificación local al sistema."
                        );
                      }
                    } catch (e) {
                      showAlert(
                        "Notificación Recibida",
                        "Notificación enviada localmente al sistema."
                      );
                    }
                  }}
                  className="px-3.5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Enviar Test
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* 0. Hora General de Notificaciones */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">
                        Hora General de Notificaciones
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Horario en que el servidor procesa y envía los resúmenes automáticos.
                      </p>
                    </div>
                  </div>
                  <input
                    type="time"
                    value={notifPrefs.preferredTime || "09:00"}
                    onChange={(e) =>
                      setNotifPrefs({
                        ...notifPrefs,
                        preferredTime: e.target.value,
                      })
                    }
                    className="glass-input text-xs py-1.5 px-3 bg-white font-bold text-slate-800 rounded-xl border border-slate-200 shadow-sm"
                  />
                </div>
              </div>

              {/* 1. Fechas de Cierre (Deadlines) */}
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-slate-700">
                        Cierres de Convocatoria (Deadlines)
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Alertas antes del vencimiento de un festival.
                      </p>
                    </div>
                  </div>
                  {renderSwitch(
                    notifPrefs.deadlines.enabled,
                    (val) => setNotifPrefs({ ...notifPrefs, deadlines: { ...notifPrefs.deadlines, enabled: val } }),
                    "bg-indigo-600"
                  )}
                </div>

                {notifPrefs.deadlines.enabled && (() => {
                  const currentDaysList = notifPrefs.deadlines.advanceDaysList || [
                    notifPrefs.deadlines.advanceDays ?? 3,
                    0,
                  ];
                  const dayOptions = [
                    { value: 7, label: "7 días" },
                    { value: 5, label: "5 días" },
                    { value: 3, label: "3 días" },
                    { value: 2, label: "2 días" },
                    { value: 1, label: "1 día" },
                    { value: 0, label: "Mismo día" },
                  ];

                  const toggleDay = (val: number) => {
                    let updated: number[];
                    if (currentDaysList.includes(val)) {
                      if (currentDaysList.length <= 1) return;
                      updated = currentDaysList.filter((d) => d !== val);
                    } else {
                      updated = [...currentDaysList, val].sort((a, b) => b - a);
                    }
                    const primaryAdvance = updated.find((d) => d > 0) || 3;
                    setNotifPrefs({
                      ...notifPrefs,
                      deadlines: {
                        ...notifPrefs.deadlines,
                        advanceDays: primaryAdvance,
                        advanceDaysList: updated,
                      },
                    });
                  };

                  return (
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Días de Notificación:
                        </span>
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/80">
                          ⚡ Avisarás {currentDaysList.map((d) => (d === 0 ? "el mismo día" : `${d}d`)).join(", ")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {dayOptions.map((opt) => {
                          const isSelected = currentDaysList.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => toggleDay(opt.value)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all duration-150 flex items-center gap-1 ${
                                isSelected
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <span className="text-[10px]">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 2. Anuncios de Selección (News Dates) */}
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-slate-700">
                        Anuncios de Selección
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Alertas cuando un festival publica sus resultados.
                      </p>
                    </div>
                  </div>
                  {renderSwitch(
                    notifPrefs.newsDates.enabled,
                    (val) => setNotifPrefs({ ...notifPrefs, newsDates: { ...notifPrefs.newsDates, enabled: val } }),
                    "bg-amber-500"
                  )}
                </div>

                {notifPrefs.newsDates.enabled && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Anticipación:
                    </span>
                    <select
                      value={notifPrefs.newsDates.advanceDays}
                      onChange={(e) =>
                        setNotifPrefs({
                          ...notifPrefs,
                          newsDates: { ...notifPrefs.newsDates, advanceDays: Number(e.target.value) },
                        })
                      }
                      className="glass-input text-xs py-1 px-3 bg-white font-bold text-slate-700 rounded-xl border border-slate-200"
                    >
                      <option value={0}>El mismo día</option>
                      <option value={1}>1 día antes (Default)</option>
                      <option value={3}>3 días antes</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 3. Cambios de Estado */}
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight text-slate-700">
                    Cambios de Estado
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Notificar cuando un festival cambia de estado (Seleccionado, Ganado, etc.).
                  </p>
                </div>
                {renderSwitch(
                  notifPrefs.statusChanges.enabled,
                  (val) => setNotifPrefs({ ...notifPrefs, statusChanges: { ...notifPrefs.statusChanges, enabled: val } }),
                  "bg-emerald-500"
                )}
              </div>

              {/* 4. Cumpleaños */}
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight text-slate-700">
                    Recordatorios de Cumpleaños 🎂
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Alertas en los cumpleaños de los miembros del equipo.
                  </p>
                </div>
                {renderSwitch(
                  notifPrefs.birthdayReminders.enabled,
                  (val) => setNotifPrefs({ ...notifPrefs, birthdayReminders: { ...notifPrefs.birthdayReminders, enabled: val } }),
                  "bg-rose-500"
                )}
              </div>

              {/* 5. Tareas y Recordatorios Personalizados */}
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight text-slate-700">
                    Tareas y Recordatorios Personalizados 📌
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Notificaciones de tareas pendientes y alarmas agendadas.
                  </p>
                </div>
                {renderSwitch(
                  notifPrefs.customReminders.enabled,
                  (val) => setNotifPrefs({ ...notifPrefs, customReminders: { ...notifPrefs.customReminders, enabled: val } }),
                  "bg-purple-600"
                )}
              </div>

              {/* 6. Horario Silencioso */}
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-slate-600" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-slate-700">
                        Horario Silencioso (No Molestar) 🌙
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Pausa las notificaciones durante un rango horario.
                      </p>
                    </div>
                  </div>
                  {renderSwitch(
                    notifPrefs.quietHours.enabled,
                    (val) => setNotifPrefs({ ...notifPrefs, quietHours: { ...notifPrefs.quietHours, enabled: val } }),
                    "bg-slate-700"
                  )}
                </div>

                {notifPrefs.quietHours.enabled && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Desde:</span>
                      <input
                        type="time"
                        value={notifPrefs.quietHours.start}
                        onChange={(e) =>
                          setNotifPrefs({
                            ...notifPrefs,
                            quietHours: { ...notifPrefs.quietHours, start: e.target.value },
                          })
                        }
                        className="glass-input text-xs py-1 px-2 font-bold text-slate-700 bg-white rounded-xl border border-slate-200"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hasta:</span>
                      <input
                        type="time"
                        value={notifPrefs.quietHours.end}
                        onChange={(e) =>
                          setNotifPrefs({
                            ...notifPrefs,
                            quietHours: { ...notifPrefs.quietHours, end: e.target.value },
                          })
                        }
                        className="glass-input text-xs py-1 px-2 font-bold text-slate-700 bg-white rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                disabled={isSavingNotifPrefs}
                onClick={() => saveNotifPrefs(notifPrefs)}
                className={`px-5 py-2.5 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${
                  hasSavedNotifPrefs
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                }`}
              >
                {hasSavedNotifPrefs ? (
                  <>
                    <Check className="h-4 w-4" /> ¡Guardado!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> {isSavingNotifPrefs ? "Guardando..." : "Guardar Ajustes"}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="glass-card p-6 space-y-6 border-l-4 border-l-rose-500">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 rounded-2xl bg-rose-50 flex items-center justify-center">
                <Settings className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  Plataformas de Envío
                </h3>
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5">
                  Gestiona las plataformas de distribución y postulación registradas en el sistema.
                </p>
              </div>
            </div>

            {/* Lista de Plataformas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Plataformas Registradas ({platforms.length})
                </h4>
                <button
                  onClick={() => setIsPlatformModalOpen(true)}
                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-lg text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm"
                >
                  <Plus className="h-3 w-3" /> Registrar Plataforma
                </button>
              </div>
              
              {platforms.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                  No hay plataformas registradas.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {platforms.map((plat, idx) => (
                    <div
                      key={`${plat.id}-${idx}`}
                      className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-white rounded-xl shadow-sm text-slate-700 border border-slate-100">
                          <PlatformIcon iconName={plat.icon} className="h-4 w-4 text-rose-500" />
                        </div>
                        <span className="text-xs font-black text-slate-700 truncate uppercase tracking-tight">
                          {plat.name}
                        </span>
                      </div>
                      
                      {INITIAL_PLATFORMS.some(ip => ip.id === plat.id || ip.name.toLowerCase().trim() === plat.name.toLowerCase().trim()) ? (
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-lg shrink-0 select-none">
                          Fijo
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDeletePlatform(plat.id, plat.name)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                          title="Eliminar plataforma"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sección Unificada: Seguridad, Celular & Autenticación de Dos Pasos (2FA) */}
          <div className="glass-card p-6 space-y-6 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  Seguridad & Autenticación de Dos Pasos (2FA)
                </h3>
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5">
                  Gestiona tu teléfono móvil de contacto para verificación SMS y configura tu aplicación autenticadora 2FA (Google Authenticator / Authy).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Celular del usuario */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-emerald-600 shrink-0" />
                    <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">
                      Teléfono Móvil (SMS)
                    </h4>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Número registrado para recibir alertas de seguridad y códigos de recuperación de 6 dígitos vía SMS.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="Ej. +54 9 11 1234 5678"
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    onClick={() => {
                      localStorage.setItem(`user_phone_${userEmail}`, userPhone.trim());
                      setIsSavingPhone(true);
                      setTimeout(() => {
                        setIsSavingPhone(false);
                        showAlert("Teléfono Guardado", "Su número de celular se ha registrado correctamente.");
                      }, 300);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {isSavingPhone ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>

              {/* 2FA con App Autenticadora */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
                      <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">
                        App Autenticadora 2FA
                      </h4>
                    </div>
                    {twoFactorSecret ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[9px] uppercase tracking-wider rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-600" /> Activo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-black text-[9px] uppercase tracking-wider rounded-full">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Genera claves temporales con Google Authenticator o Authy para proteger la visualización y edición de llaves API secretas.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  {twoFactorSecret ? (
                    <>
                      <button
                        onClick={() => {
                          request2FA("Re-configurar Autenticación 2FA", () => {
                            open2FASetupModal();
                          });
                        }}
                        className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Lock className="h-3.5 w-3.5 text-emerald-400" />
                        Re-configurar
                      </button>
                      <button
                        onClick={() => {
                          request2FA("Desactivar Autenticación de Dos Pasos (2FA)", () => {
                            setTwoFactorSecret("");
                            showAlert("2FA Desactivado", "Se ha eliminado la clave 2FA.");
                          });
                        }}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Desactivar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => open2FASetupModal()}
                      className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Smartphone className="h-4 w-4" />
                      Activar y Configurar 2FA (QR)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sección Unificada: Instituciones Reguladoras y Escuelas de Cine */}
          <div className="glass-card p-6 space-y-6 border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    Instituciones Reguladoras y Escuelas de Cine
                  </h3>
                  <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5">
                    Gestioná las instituciones académicas y reguladoras oficiales del plan de distribución.
                  </p>
                </div>
              </div>

              <button
                onClick={handleOpenAddInstitution}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-lg text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Registrar Institución
              </button>
            </div>

            {/* Listado de Instituciones */}
            {institutions.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                No hay instituciones registradas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {institutions.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex flex-col justify-between p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate">
                            {inst.nombre}
                          </h4>
                          {inst.responsable && (
                            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-tight">
                              Resp: {inst.responsable}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditInstitution(inst)}
                            className="p-1.5 bg-white border border-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-all shadow-sm cursor-pointer"
                            title="Editar institución"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteInstitution(inst.id, inst.nombre)}
                            className="p-1.5 bg-white border border-slate-100 hover:border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all shadow-sm cursor-pointer"
                            title="Eliminar institución"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {inst.emailContacto && (
                        <p className="text-xs font-mono text-slate-600 flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                          <span className="truncate">{inst.emailContacto}</span>
                        </p>
                      )}

                      {inst.notas && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed italic bg-white/60 p-2 rounded-xl border border-slate-100">
                          {inst.notas}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>



          <div className="text-center pt-8 pb-4 space-y-1">
            <p
              className="text-[10px] font-black uppercase tracking-widest text-[#e91e63] cursor-pointer"
              onClick={(e) => {
                if (e.detail === 3) {
                  setEasterEggUnlocked(true);
                  showAlert("Se ha revelado un secreto");
                }
              }}
            >
              Gestión Integral de Festivales
            </p>
            <p 
              className="text-[9px] font-bold text-slate-600 hover:text-[#e91e63] cursor-pointer select-none transition-colors"
              onClick={() => {
                setVersionClicks((prev) => {
                  const nextVal = prev + 1;
                  if (nextVal >= 3) {
                    setIsExploding(true);
                    setEasterEggUnlocked(true);
                    showAlert("¡Se ha desbloqueado la Taza 3D en la PlayZone! 🏆");
                    setTimeout(() => {
                      setIsExploding(false);
                    }, 4000);
                  }
                  return nextVal;
                });
              }}
            >
              Versión {APP_VERSION} {versionClicks > 0 && versionClicks < 3 && `(${versionClicks}/3)`}
            </p>
          </div>
        </div>
      )}

      {configTab === "services" && (
        <div className="space-y-8">


          <div className="text-center pt-8 pb-4 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#e91e63]">
              Gestión Integral de Festivales
            </p>
            <p className="text-[9px] font-bold text-slate-600">
              Versión {APP_VERSION}
            </p>
          </div>
        </div>
      )}

      {configTab === "members" && (
        <div className="space-y-6">
          {members.map((member: AppMember, idx: number) => {
            const bgColors = [
              "bg-rose-50/50 shadow-rose-100/50 border-rose-100",
              "bg-blue-50/50 shadow-blue-100/50 border-blue-100",
              "bg-emerald-50/50 shadow-emerald-100/50 border-emerald-100",
              "bg-amber-50/50 shadow-amber-100/50 border-amber-100",
              "bg-purple-50/50 shadow-purple-100/50 border-purple-100",
              "bg-cyan-50/50 shadow-cyan-100/50 border-cyan-100",
              "bg-orange-50/50 shadow-orange-100/50 border-orange-100",
            ];
            const randomBg =
              bgColors[(member.email || "").charCodeAt(0) % bgColors.length] ||
              "bg-slate-50/50 border-slate-100";
            return (
              <div
                key={`cfg-m-${member.id || 'm'}-${idx}`}
                className={cn(
                  "p-6 space-y-4 relative group rounded-3xl border shadow-sm backdrop-blur-md",
                  randomBg,
                )}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 border border-slate-200 uppercase">
                      {(member.name || member.email || "?").charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2 items-center">
                          <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight">
                            {member.name || "Usuario"}
                          </h3>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setPromptConfig({
                                  isOpen: true,
                                  title: `Cambiar nombre a ${member.email}:`,
                                  value: member.name || "",
                                  onSubmit: (newName: string) => {
                                    if (newName) {
                                      setMembers(
                                        members.map((m) =>
                                          m.id === member.id
                                            ? { ...m, name: newName }
                                            : m,
                                        ),
                                      );
                                      addAuditLog(
                                        "authmembers",
                                        `${userName} ha cambiado el nombre de ${member.email} a ${newName}.`,
                                      );
                                    }
                                  },
                                });
                              }}
                              className="text-slate-400 hover:text-pink-500 transition-colors"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        {isAdmin ? (
                          <select
                            value={member.role || "externo"}
                            onChange={(e) => {
                              const newRole = e.target
                                .value as AppMember["role"];
                              setMembers(
                                members.map((m) =>
                                  m.id === member.id
                                    ? { ...m, role: newRole }
                                    : m,
                                ),
                              );
                              addAuditLog(
                                "authmembers",
                                `${userName} ha cambiado el rol de ${member.name || member.email} a ${newRole}.`,
                              );
                            }}
                            disabled={
                              member.email === "axeldibarra@gmail.com" ||
                              member.email === "luciaruocco1313@gmail.com"
                            }
                            className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border focus:outline-none",
                              member.role === "dev"
                                ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                : member.role === "admin"
                                  ? "bg-amber-50 text-amber-600 border-amber-200"
                                  : member.role === "visitante"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    : "bg-slate-50 text-slate-500 border-slate-200",
                              member.email === "axeldibarra@gmail.com" ||
                                member.email === "luciaruocco1313@gmail.com"
                                ? "opacity-50 cursor-not-allowed"
                                : "",
                            )}
                          >
                            <option value="dev">Dev</option>
                            <option value="admin">Administrador</option>
                            <option value="visitante">Visitante</option>
                            <option value="externo">Externo (Bloqueado)</option>
                          </select>
                        ) : (
                          <p
                            className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border",
                              member.role === "dev"
                                ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                : member.role === "admin"
                                  ? "bg-amber-50 text-amber-600 border-amber-200"
                                  : member.role === "visitante"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    : "bg-slate-50 text-slate-500 border-slate-200",
                            )}
                          >
                            {member.role || "Externo"}
                          </p>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  {isAdmin &&
                    member.role !== "dev" &&
                    member.email !== "axeldibarra@gmail.com" &&
                    member.email !== "luciaruocco1313@gmail.com" && (
                      <button
                        onClick={() => {
                          setConfirmConfig({
                            isOpen: true,
                            title: `¿Eliminar a ${member.name || member.email}?`,
                            onConfirm: () => {
                              setMembers(
                                members.filter((m: any) => m.id !== member.id),
                              );
                              addAuditLog(
                                "authmembers",
                                `${userName} ha eliminado a ${member.name || member.email} del equipo.`,
                              );
                            },
                          });
                        }}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-full p-2"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                </div>

                {userEmail === "axeldibarra@gmail.com" && (
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Cumpleaños
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={member.birthday || ""}
                        onChange={(e) => {
                          setMembers(
                            members.map((m) =>
                              m.id === member.id
                                ? { ...m, birthday: e.target.value }
                                : m,
                            ),
                          );
                        }}
                        className="text-[10px] bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Emails Autorizados
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(member.authorizedEmails || []).map((email: string, idx: number) => (
                      <div
                        key={`cfg-m-${member.id || 'm'}-email-${email}-${idx}`}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-600 border border-slate-100"
                      >
                        {email}
                        {isAdmin && member.role !== "dev" && (
                          <button
                            id={`btn-auto-21-${email}`}
                            onClick={() => {
                              setMembers(
                                members.map((m: any) =>
                                  m.id === member.id
                                    ? {
                                        ...m,
                                        authorizedEmails:
                                          m.authorizedEmails.filter(
                                            (e: string) => e !== email,
                                          ),
                                      }
                                    : m,
                                ),
                              );
                              addAuditLog(
                                "authmembers",
                                `${userName} le ha quitado acceso a la cuenta de ${email} para ${member.name}.`,
                              );
                            }}
                            className="text-slate-300 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {isAdmin && member.role !== "dev" && (
                      <button
                        id={`btn-auto-22-${member.id}`}
                        onClick={() => {
                          setPromptConfig({
                            isOpen: true,
                            title: `Añadir email para ${member.name}:`,
                            value: "",
                            onSubmit: (email: string) => {
                              if (
                                email &&
                                !member.authorizedEmails.includes(email)
                              ) {
                                setMembers(
                                  members.map((m: any) =>
                                    m.id === member.id
                                      ? {
                                          ...m,
                                          authorizedEmails: [
                                            ...m.authorizedEmails,
                                            email,
                                          ],
                                        }
                                      : m,
                                  ),
                                );
                                addAuditLog(
                                  "authmembers",
                                  `${userName} ha dado acceso a la cuenta de ${email} para ${member.name}.`,
                                );
                              }
                            },
                          });
                        }}
                        className="px-3 py-1.5 bg-pink-50 text-[#e91e63] rounded-xl text-[10px] font-black uppercase tracking-widest border border-pink-100 hover:bg-pink-100 transition-colors"
                      >
                        + AÑADIR
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => {
                setPromptConfig({
                  isOpen: true,
                  title: "Nombre del nuevo miembro:",
                  value: "",
                  onSubmit: (name: string) => {
                    if (name) {
                      setPromptConfig({
                        isOpen: true,
                        title: "Email del nuevo miembro:",
                        value: "",
                        onSubmit: (email: string) => {
                          if (
                            email &&
                            !members.some((m: any) => m.email === email)
                          ) {
                            setMembers([
                              ...members,
                              {
                                id: email,
                                name,
                                email,
                                authorizedEmails: [email],
                                role: "visitante",
                              },
                            ]);
                            addAuditLog(
                              "authmembers",
                              `${userName} ha añadido a ${name} (${email}) al equipo.`,
                            );
                          }
                        },
                      });
                    }
                  },
                });
              }}
              className="w-full py-4 glass-card border-none bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest transition-all"
            >
              <Users className="h-4 w-4 text-[#e91e63]" /> + Añadir Nuevo
              Miembro
            </button>
          )}
        </div>
      )}

      {configTab === "database" && (
        <div className="space-y-8">
          <div className="glass-card p-6 space-y-4 border-l-4 border-l-[#e91e63]">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#e91e63] flex items-center gap-2">
              <Download className="h-4 w-4" /> Herramientas de migración
            </h3>
            <p className="text-xs text-slate-500">
              Maneja la migración de datos para tu base de datos actual.
            </p>
            <button
              id="btn-auto-4"
              onClick={() => {
                if (!isAuthorized) {
                  showAlert("No tienes permisos para realizar esta acción.");
                  return;
                }
                setIsExcelModalOpen(true);
                setTimeout(() => {
                  const existingNamesMap = new Map(
                    festivals.map((f) => [f.name.toLowerCase().trim(), f]),
                  );
                  const newFestivals = INITIAL_FESTIVALS.filter(
                    (f) => !existingNamesMap.has(f.name.toLowerCase().trim()),
                  );

                  let updatedCount = 0;
                  const updatedFestivals = festivals.map((f) => {
                    const initF = INITIAL_FESTIVALS.find(
                      (inf) =>
                        inf.name.toLowerCase().trim() ===
                        f.name.toLowerCase().trim(),
                    );
                    if (initF && initF.status !== f.status) {
                      updatedCount++;
                      return { ...f, status: initF.status };
                    }
                    return f;
                  });

                  setExcelImportStats({
                    imported: newFestivals.length,
                    updated: updatedCount,
                    total: INITIAL_FESTIVALS.length,
                  });
                  setFestivals([
                    ...updatedFestivals,
                    ...newFestivals,
                  ] as Festival[]);
                }, 1500);
              }}
              className="w-full bg-white text-emerald-500 font-black text-[10px] px-6 py-4 rounded-3xl flex items-center justify-center gap-2 shadow-xl shadow-slate-100 border border-emerald-50 hover:bg-emerald-50 transition-all"
            >
              <Download className="h-4 w-4" /> Importar Default Excel
            </button>
            <div className="border-t border-slate-100 my-2 pt-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#e91e63] flex items-center gap-2 mb-2">
                ☁️ Migrar a Nube Local
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Migrar los datos iniciales y locales (LocalStorage) de tu cuenta
                actual hacia Firebase. Apretá aquí para crear las colecciones en
                la nube por primera vez, o si ves la aplicación vacía.
              </p>
              <button
                onClick={handleMigrateToCloud}
                className="w-full py-4 text-xs font-black bg-[#e91e63] text-white uppercase tracking-widest rounded-xl hover:bg-pink-600 transition shadow-lg"
              >
                Forzar Migración a Firestore
              </button>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4 border-l-4 border-l-emerald-500">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <Database className="h-4 w-4" /> Importar / Exportar
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Exporta tu base de datos para respaldos, o importa un archivo
              previamente exportado.
            </p>
            <div className="flex gap-2 flex-col sm:flex-row flex-wrap">
              <button
                id="btn-auto-23"
                onClick={exportDB}
                className="flex-1 py-3 bg-[#e91e63] font-black text-white text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#c2185b] flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" /> Exportar a JSON
              </button>

              <button
                onClick={exportDBExcel}
                className="flex-1 py-3 bg-emerald-500 font-black text-white text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-600 flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" /> Exportar a Excel
              </button>

              <label className="flex-1 py-3 bg-slate-100 font-black text-slate-700 border border-slate-200 text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="h-4 w-4" /> Importar de JSON/Zip
                <input
                  type="file"
                  accept=".json,.zip"
                  className="hidden"
                  onChange={importDB}
                />
              </label>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4 border-l-4 border-l-slate-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <Github className="h-4 w-4" /> Repositorio en GitHub
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Accede al código fuente de la aplicación, reporta problemas
              (issues) o contribuye al proyecto.
            </p>
            <button
              onClick={() =>
                window.open(
                  "https://github.com/LurychD/festis-manager-app.git",
                  "_blank",
                )
              }
              className="w-full py-4 text-xs font-black bg-slate-800 text-white uppercase tracking-widest rounded-xl hover:bg-slate-700 transition shadow-lg flex items-center justify-center gap-2"
            >
              <Github className="h-4 w-4" /> Ir a GitHub
            </button>
          </div>

          <div className="glass-card p-6 space-y-4 border-l-4 border-l-blue-500">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Monitor de Base de Datos
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>{" "}
                Servidor En Línea
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Festivals
                </span>
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-black text-blue-500">
                    {festivals.length}
                  </span>
                  <button
                    onClick={() => downloadCollection("festivals", festivals)}
                    className="text-slate-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Members
                </span>
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-black text-indigo-500">
                    {members.length}
                  </span>
                  <button
                    onClick={() => downloadCollection("members", members)}
                    className="text-slate-400 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  FilmData
                </span>
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-black text-purple-500">
                    {filmData.length}
                  </span>
                  <button
                    onClick={() => downloadCollection("filmData", filmData)}
                    className="text-slate-400 hover:text-purple-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Audit Logs
                </span>
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-black text-slate-800">
                    {auditLogs.length}
                  </span>
                  <button
                    onClick={() => downloadCollection("auditLogs", auditLogs)}
                    className="text-slate-400 hover:text-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Notes
                </span>
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-black text-rose-500">
                    {notes.length}
                  </span>
                  <button
                    onClick={() => downloadCollection("notes", notes)}
                    className="text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Social Posts
                </span>
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-black text-teal-500">
                    {socialPosts.length}
                  </span>
                  <button
                    onClick={() => downloadCollection("social_posts", socialPosts)}
                    className="text-slate-400 hover:text-teal-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Reminders
                </span>
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-black text-cyan-500">
                    {reminders.length}
                  </span>
                  <button
                    onClick={() => downloadCollection("reminders", reminders)}
                    className="text-slate-400 hover:text-cyan-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Gallery
                </span>
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-black text-orange-500">
                    {gallery.length}
                  </span>
                  <button
                    onClick={() => downloadCollection("gallery", gallery)}
                    className="text-slate-400 hover:text-orange-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Planes Distribución
                </span>
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-black text-rose-500">
                    {distributionPlans.length}
                  </span>
                  <button
                    onClick={() => downloadCollection("distribution_plans", distributionPlans)}
                    className="text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Instituciones
                </span>
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-black text-indigo-500">
                    {institutions.length}
                  </span>
                  <button
                    onClick={() => downloadCollection("institutions", institutions)}
                    className="text-slate-400 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center group">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Plataformas
                </span>
                <div className="flex gap-4 items-center">
                  <span className="text-sm font-black text-emerald-500">
                    {platforms.length}
                  </span>
                  <button
                    onClick={() => downloadCollection("platforms", platforms)}
                    className="text-slate-400 hover:text-emerald-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4 border-l-4 border-l-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> Auditoría de Cambios
              </h3>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportAuditPDF}
                  className="shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors"
                  title="Exportar a PDF"
                >
                  <FileText className="h-4 w-4" /> PDF
                </button>
                <div className="relative w-full sm:w-64">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={auditSearchTerm}
                    onChange={(e) => setAuditSearchTerm(e.target.value)}
                    placeholder="Buscar en auditoría..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-800 transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {auditLogs.filter(
                (log) =>
                  (log.details || "")
                    .toLowerCase()
                    .includes(auditSearchTerm.toLowerCase()) ||
                  (log.collection || "")
                    .toLowerCase()
                    .includes(auditSearchTerm.toLowerCase()) ||
                  (log.user || "")
                    .toLowerCase()
                    .includes(auditSearchTerm.toLowerCase()),
              ).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    No hay registros de auditoría aún.
                  </p>
                </div>
              ) : (
                auditLogs
                  .filter(
                    (log) =>
                      (log.details || "")
                        .toLowerCase()
                        .includes(auditSearchTerm.toLowerCase()) ||
                      (log.collection || "")
                        .toLowerCase()
                        .includes(auditSearchTerm.toLowerCase()) ||
                      (log.user || "")
                        .toLowerCase()
                        .includes(auditSearchTerm.toLowerCase()),
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime(),
                  )
                  .slice(0, 50)
                  .map((log, idx) => (
                    <div
                      key={`cfg-log-${log.id || 'l'}-${idx}`}
                      className="border-b border-slate-100 pb-3 last:border-0"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          {format(
                            parseISO(log.timestamp),
                            "dd/MM/yyyy HH:mm:ss",
                          )}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {log.collection}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-snug">
                        <span className="font-bold">{log.user}:</span>{" "}
                        {log.details}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {configTab === "visuals" && (
        <div className="space-y-8">
          {/* Modo Desaturado */}
          <div className="glass-card p-6 flex items-center justify-between border-l-4 border-l-slate-400">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-slate-100 flex items-center justify-center">
                <MonitorPlay className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  Modo Desaturado
                </h3>
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5">
                  Test de contrastes y accesibilidad cromática
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const val = !isDesaturated;
                setIsDesaturated(val);
                localStorage.setItem("isDesaturated", String(val));
              }}
              className={cn(
                "w-14 h-8 rounded-full transition-colors flex items-center px-1 shrink-0",
                isDesaturated ? "bg-slate-800" : "bg-slate-300",
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full bg-white transition-transform transform shadow-sm",
                  isDesaturated ? "translate-x-6" : "",
                )}
              />
            </button>
          </div>

          {/* Configuración de Shaders */}
          <div className="glass-card p-6 space-y-6 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  Configuración de Shaders (Filtros Estéticos)
                </h3>
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-0.5">
                  Aplica efectos visuales avanzados para transformar la apariencia estética general de la plataforma.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <ShaderConfigGroup 
                title="Textura de Papel"
                enabled={usePaperShader} onToggle={(v) => { setUsePaperShader(v); localStorage.setItem("usePaperShader", String(v)); }}
                opacity={paperOpacity} onOpacityChange={(v) => { setPaperOpacity(v); localStorage.setItem("paperOpacity", String(v)); }}
                blendMode={paperBlendMode} onBlendModeChange={(v) => { setPaperBlendMode(v); localStorage.setItem("paperBlendMode", v); }}
                params={paperParams} onParamsChange={updatePaperParam} colorTheme="bg-amber-500"
                controls={[
                  { key: 'scale', label: 'Scale', min: 0, max: 2, step: 0.05 },
                  { key: 'contrast', label: 'Contrast', min: 0, max: 2, step: 0.05 },
                  { key: 'roughness', label: 'Roughness', min: 0, max: 1, step: 0.05 },
                  { key: 'fiber', label: 'Fiber', min: 0, max: 1, step: 0.05 },
                  { key: 'crumples', label: 'Crumples', min: 0, max: 1, step: 0.05 },
                  { key: 'folds', label: 'Folds', min: 0, max: 1, step: 0.05 },
                  { key: 'fade', label: 'Fade', min: 0, max: 1, step: 0.05 }
                ]}
              />

              <ShaderConfigGroup 
                title="CMYK Halftone"
                enabled={useCmykShader} onToggle={(v) => { setUseCmykShader(v); localStorage.setItem("useCmykShader", String(v)); }}
                opacity={cmykOpacity} onOpacityChange={(v) => { setCmykOpacity(v); localStorage.setItem("cmykOpacity", String(v)); }}
                blendMode={cmykBlendMode} onBlendModeChange={(v) => { setCmykBlendMode(v); localStorage.setItem("cmykBlendMode", v); }}
                params={cmykParams} onParamsChange={updateCmykParam} colorTheme="bg-cyan-500"
                controls={[
                  { key: 'scale', label: 'Scale', min: 0, max: 5, step: 0.1 },
                  { key: 'size', label: 'Dot Size', min: 0, max: 1, step: 0.05 },
                  { key: 'contrast', label: 'Contrast', min: 0, max: 3, step: 0.1 },
                  { key: 'softness', label: 'Softness', min: 0, max: 2, step: 0.1 },
                  { key: 'grainSize', label: 'Grain Size', min: 0, max: 1, step: 0.05 },
                  { key: 'gridNoise', label: 'Grid Noise', min: 0, max: 1, step: 0.05 }
                ]}
              />

              <ShaderConfigGroup 
                title="Granulado (Simplex Noise)"
                enabled={useGrainShader} onToggle={(v) => { setUseGrainShader(v); localStorage.setItem("useGrainShader", String(v)); }}
                opacity={grainOpacity} onOpacityChange={(v) => { setGrainOpacity(v); localStorage.setItem("grainOpacity", String(v)); }}
                blendMode={grainBlendMode} onBlendModeChange={(v) => { setGrainBlendMode(v); localStorage.setItem("grainBlendMode", v); }}
                params={grainParams} onParamsChange={updateGrainParam} colorTheme="bg-indigo-500"
                controls={[
                  { key: 'scale', label: 'Scale', min: 0, max: 5, step: 0.1 },
                  { key: 'speed', label: 'Speed', min: 0, max: 5, step: 0.1 },
                  { key: 'stepsPerColor', label: 'Steps/Color', min: 0, max: 10, step: 1 },
                  { key: 'softness', label: 'Softness', min: 0, max: 2, step: 0.1 }
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {configTab === "info" && (
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4 border-l-4 border-l-blue-500">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Información de Versión
            </h3>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Plataforma de gestión y distribución de obras y festivales audiovisuales. <br />©
              2026 Reservados todos los derechos.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 w-max">
              <div
                className="flex items-center gap-2 text-[11px] font-black tracking-widest uppercase bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer px-3 py-1.5 rounded-lg w-full sm:w-auto"
                onClick={(e) => {
                  if (e.detail === 3) {
                    setEasterEggUnlocked(true);
                    showAlert("Se ha revelado un secreto");
                  }
                }}
              >
                Versión {APP_VERSION}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase bg-neutral-800 text-neutral-400 px-3 py-1.5 rounded-lg w-full sm:w-auto">
                <Github className="w-3 h-3 text-neutral-500" />
                Commit:{" "}
                {(import.meta as any).env.VITE_GITHUB_SHA?.substring(0, 7) ||
                  "local-dev"}
              </div>
            </div>

            {/* Botón de acceso a la Documentación */}
            {setView && (
              <div className="pt-4 border-t border-slate-200/60 mt-4">
                <button
                  onClick={() => setView("docs")}
                  className="px-5 py-2.5 bg-black hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95"
                >
                  <BookOpen className="h-4 w-4 text-purple-400" />
                  <span>Documentación</span>
                </button>
              </div>
            )}
          </div>

          <div className="glass-card p-6 space-y-4 border-l-4 border-l-teal-500">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <Zap className="h-4 w-4 text-teal-500" /> Modelos de Inteligencia Artificial Activos
            </h3>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              La plataforma utiliza un ecosistema híbrido de modelos de lenguaje y visión (LLMs) optimizados para el procesamiento de bases de festivales, lectura de PDF/imágenes y la traducción precisa de fichas técnicas cinematográficas.
            </p>
            
            <div className="space-y-6 pt-2">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-3">Modelos Utilizados en la Aplicación:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "meta-llama/Llama-3.2-11B-Vision-Instruct", name: "Llama 3.2 11B Vision", provider: "Hugging Face", type: "Motor de visión principal para procesar PDFs e imágenes de bases." },
                    { id: "Qwen/Qwen2-VL-7B-Instruct", name: "Qwen 2 VL 7B", provider: "Hugging Face", type: "Respaldo secundario de visión para lectura de bases de convocatorias." },
                    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "Groq Cloud", type: "Análisis inteligente de textos directos sin archivos adjuntos." },
                    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google Gemini", type: "Modelo de visión de alta resiliencia si Hugging Face alcanza cuotas." },
                    { id: "gemini-3-flash-preview", name: "Gemini 3.5 Flash (v3)", provider: "Google Gemini", type: "Traductor contextual para adaptar carpetas y Fichas Técnicas." },
                  ].map((m, idx) => (
                    <div key={`${m.id}-${idx}`} className="flex flex-col p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-black text-slate-700 tracking-tight">{idx + 1}. {m.name}</span>
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0",
                          m.provider.includes("Gemini") ? "bg-teal-50 text-teal-600 border-teal-100" :
                          m.provider.includes("Groq") ? "bg-orange-50 text-orange-600 border-orange-100" :
                          "bg-purple-50 text-purple-600 border-purple-100"
                        )}>
                          {m.provider}
                        </span>
                      </div>
                      <span className="text-[9px] text-teal-600 font-bold mt-1 font-mono break-all leading-none">{m.id}</span>
                      <span className="text-[9px] text-slate-400 mt-1 leading-normal">{m.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-2">Cuotas Gratuitas por Proveedor:</h4>
                <ul className="space-y-2 text-[10px] text-slate-500 font-medium">
                  <li>• <strong className="text-slate-700">Google Gemini API:</strong> El nivel gratuito ofrece hasta 15 RPM (peticiones por minuto) y 1M de tokens por minuto (TPM), lo que permite crawlear de forma sostenida sin ningún costo ingresando tu propia clave.</li>
                  <li>• <strong className="text-slate-700">Groq Cloud API:</strong> Proporciona límites diarios generosos en su nivel de desarrollo gratuito (desde 14,400 TDP hasta un límite de tokens diario, ideal para usar Llama 3.3 70B como un cerebro veloz).</li>
                  <li>• <strong className="text-slate-700">Hugging Face Inference API:</strong> Su API Serverless permite consultar miles de modelos hospedados de forma completamente gratuita enviando un token común de lectura generado desde tu perfil de Hugging Face.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-6 border-l-4 border-l-indigo-500">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Settings className="h-4 w-4" /> Librerías y Herramientas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "React", version: "^19.0.1" },
                { name: "Vite", version: "^6.2.3" },
                { name: "Tailwind CSS", version: "^4.1.14" },
                { name: "Firebase", version: "^12.13.0" },
                { name: "Lucide React", version: "^0.546.0" },
                { name: "Motion", version: "^12.23.24" },
                { name: "Leaflet", version: "^1.9.4" },
                { name: "Recharts", version: "^3.8.1" },
                { name: "otplib", version: "^13.4.0" },
                { name: "html2canvas", version: "^1.4.1" },
                { name: "jsPDF", version: "^4.2.1" },
                { name: "JSZip", version: "^3.10.1" },
                { name: "XLSX", version: "^0.18.5" },
                { name: "Three.js", version: "^0.184.0" },
                { name: "date-fns", version: "^4.1.0" },
                { name: "topojson-client", version: "^3.1.0" },
                { name: "FestisUtils v.2", version: "SECRET" },
              ].map((lib, idx) => (
                <div
                  key={`${lib.name}-${idx}`}
                  className={cn(
                    "flex justify-between items-center px-4 py-3 rounded-xl transition-colors",
                    lib.name === "FestisUtils v.2"
                      ? "bg-indigo-50 border border-indigo-200 cursor-pointer hover:bg-indigo-100"
                      : "bg-slate-50 border border-slate-200",
                  )}
                  onClick={() => {
                    if (lib.name === "FestisUtils v.2") {
                      showAlert("Se vienen cositas");
                    }
                  }}
                >
                  <span
                    className={cn(
                      "text-[11px] font-black uppercase tracking-widest",
                      lib.name === "FestisUtils v.2"
                        ? "text-indigo-700"
                        : "text-slate-700",
                    )}
                  >
                    {lib.name}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded shadow-sm border",
                      lib.name === "FestisUtils v.2"
                        ? "text-indigo-500 bg-indigo-100 border-indigo-200"
                        : "text-slate-400 bg-white border-slate-100",
                    )}
                  >
                    {lib.version}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isDebugMode && (
        <div className="glass-card p-6 space-y-4 border-l-4 border-l-red-500 mt-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
            <Database className="h-4 w-4 text-red-500" /> Zona de Peligro (Debug
            Mode)
          </h3>
          <p className="text-[10px] text-slate-400 font-medium">
            Las acciones aquí son irreversibles.
          </p>
          <button
            id="btn-auto-29-moved"
            onClick={() => {
              setConfirmConfig({
                isOpen: true,
                title: "¿Estas segurx que deseas eliminar la base de datos?",
                onConfirm: () => {
                  setTimeout(() => {
                    setConfirmConfig({
                      isOpen: true,
                      title:
                        "¿Segurisimx? Por motivos de seguridad, se descargará la base de datos en formato JSON. Podras importarla de nuevo en configuración.",
                      onConfirm: () => {
                        exportDB();
                        setTimeout(() => {
                          setPromptConfig({
                            isOpen: true,
                            title:
                              "Ingresa el código generado en la aplicación 2FA:",
                            value: "",
                            inputType: "text",
                            onSubmit: (val: string) => {
                              if (!twoFactorSecret) {
                                showAlert(
                                  "No tienes configurado el 2FA. Ve a la pestaña General -> Debug Mode.",
                                );
                                return;
                              }
                              if (authenticator.check(val, twoFactorSecret)) {
                                setFestivals([]);
                                setMembers([]);
                                setNotifications([]);
                                setAuditLogs([]);
                                setNotes([]);
                                setBugs([]);
                                setRoadmap([]);
                                showAlert(
                                  "Borrando base de datos... Base de datos borrada exitosamente. Base de datos en JSON descargadas.",
                                );
                              } else {
                                showAlert(
                                  "Código incorrecto, operación cancelada.",
                                );
                              }
                            },
                          });
                        }, 500);
                      },
                    });
                  }, 400);
                },
              });
            }}
            className="w-full py-3 flex items-center justify-center rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            Borrar Base de Datos
          </button>
        </div>
      )}

      {configTab === "desarrollo" && (
        <div className="space-y-6">
          {effectiveRole === "dev" && (
            <div className="glass-card p-6 space-y-6 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                    Configuraciones de desarrollador
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setView?.("theme_showcase")}
                  className="px-3.5 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-pink-500/20 transition-all cursor-pointer"
                >
                  <Palette className="h-4 w-4" /> Laboratorio UI & Temas
                </button>
              </div>

              <div className="space-y-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-600" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                    Simulador de Roles
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Alterna tu rol temporalmente para probar la interfaz (recarga
                  la página para deshacer).
                </p>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  {(["dev", "admin", "visitante", "externo"] as const).map(
                    (role, idx) => (
                      <button
                        id={`btn-sim-role-${role}`}
                        key={`${role}-${idx}`}
                        onClick={() =>
                          setTestRole(testRole === role ? null : role)
                        }
                        className={cn(
                          "flex-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                          testRole === role ||
                            (!testRole && effectiveRole === role)
                            ? "bg-white text-purple-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200",
                        )}
                      >
                        {role}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}

          <div
            className="glass-card p-6 border-l-4 border-l-amber-500 bg-amber-50/50 cursor-pointer hover:bg-amber-100 transition-colors group"
            onClick={() => {
              if (setView) {
                // Notify App.tsx to transition into Secretos
                const btn = document.getElementById("btn-play-zone-portal");
                if (btn) btn.click();
                else setView("play_zone");
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500/20 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
                    Secretos
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Museo de Easter Eggs y misterios del sistema
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-amber-500" />
            </div>
          </div>

          <div className="glass-card p-6 space-y-6 mb-6 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" /> Funciones Experimentales
                </h3>
                <p className="text-[10px] text-slate-500 font-medium mt-1">
                  Activa funciones en fase beta como el asistente con IA y módulos de seguridad avanzados.
                </p>
              </div>
              {renderSwitch(
                localDevSettings.experimentalFeatures,
                (val) => setLocalDevSettings((p) => ({ ...p, experimentalFeatures: val })),
                "bg-indigo-600"
              )}
            </div>

            {/* Sub-Feature Experimental: Autenticación 2FA para Spark */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Autenticación 2FA para Clave Spark (Experimental)
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Exige validación TOTP o código de recuperación por Email y SMS para ver o modificar la API Key de Gemini Spark.
                    </p>
                  </div>
                </div>
                {renderSwitch(
                  isExperimental2FAEnabled,
                  (val) => toggleExperimental2FA(val),
                  "bg-indigo-600"
                )}
              </div>

              {isExperimental2FAEnabled && (
                <div className="pt-3 border-t border-indigo-100/80 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => open2FASetupModal()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    {twoFactorSecret ? "Re-configurar App QR 2FA" : "Configurar App QR 2FA"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendRecoveryCode}
                    disabled={isSendingRecovery}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {isSendingRecovery ? "Enviando..." : "Probar Código OTP (Email & SMS)"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Herramientas de Testeo de Ciclo de Vida (Solo con Debug Mode) */}
          {isDebugMode && (
            <div className="glass-card p-6 space-y-4 border-l-4 border-l-emerald-500 bg-emerald-50/30 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-900 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-emerald-600" /> Herramientas de Testeo: Ciclo de Vida
                  </h3>
                  <p className="text-[10px] text-emerald-700 font-medium mt-1">
                    Prueba el cierre automático de convocatorias vencidas y la creación simulada de nuevas ediciones.
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                  Debug Mode Activo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  id="btn-test-sim-close"
                  onClick={() => {
                    const porEnviar = festivals.find(f => f.status === FestivalStatus.POR_ENVIAR);
                    if (!porEnviar) {
                      showAlert("Modo Debug", "No hay festivales en estado 'Por enviar' para forzar el cierre. Registra uno primero.");
                      return;
                    }
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toISOString().split('T')[0];

                    const updated = festivals.map(f => f.id === porEnviar.id ? { ...f, deadline: yesterdayStr } : f);
                    setFestivals(updated);
                    showAlert("Modo Debug", `Se forzó la fecha límite del festival '${porEnviar.name}' a ayer (${yesterdayStr}). El sistema lo cerrará automáticamente.`);
                  }}
                  className="p-3.5 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-2xl text-emerald-900 font-bold text-xs text-left shadow-sm transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <Clock className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-extrabold text-slate-800">Forzar Vencimiento de Convocatoria</p>
                    <p className="text-[10px] text-slate-500 font-normal">Cambia la fecha de un 'Por enviar' a ayer para probar la transición a 'Cerrado'.</p>
                  </div>
                </button>

                <button
                  type="button"
                  id="btn-test-sim-new-edition"
                  onClick={() => {
                    const cerradoOFinal = festivals.find(f => f.status === FestivalStatus.CERRADO || f.status === FestivalStatus.NO_SELECCIONADO || f.status === FestivalStatus.PROYECTADO || f.status === FestivalStatus.DESCALIFICADO) || festivals[0];
                    if (!cerradoOFinal) {
                      showAlert("Modo Debug", "No hay festivales en la base de datos.");
                      return;
                    }
                    const nextYear = new Date().getFullYear() + 1;
                    const newF: Festival = {
                      id: Date.now().toString(),
                      name: `${cerradoOFinal.name} ${nextYear}`,
                      country: cerradoOFinal.country,
                      type: cerradoOFinal.type,
                      status: FestivalStatus.POR_ENVIAR,
                      platform: cerradoOFinal.platform,
                      price: cerradoOFinal.price || "Gratis",
                      category: cerradoOFinal.category,
                      link: cerradoOFinal.link,
                      tasks: [],
                      previousEditionId: cerradoOFinal.id,
                      editionYear: nextYear,
                      statusHistory: [{
                        id: Date.now().toString(),
                        status: FestivalStatus.POR_ENVIAR,
                        timestamp: new Date().toISOString(),
                        updatedBy: "Herramientas de Testeo",
                        note: `Test: Nueva edición creada automáticamente desde edición previa ID: ${cerradoOFinal.id}`
                      }]
                    };
                    setFestivals([newF, ...festivals]);
                    showAlert("Modo Debug", `Se generó una edición de prueba '${newF.name}' vinculada a '${cerradoOFinal.name}'.`);
                  }}
                  className="p-3.5 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-2xl text-emerald-900 font-bold text-xs text-left shadow-sm transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <RefreshCw className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-extrabold text-slate-800">Generar Nueva Edición de Prueba</p>
                    <p className="text-[10px] text-slate-500 font-normal">Crea al instante una nueva edición enlazada con trazabilidad histórica.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {(userEmail === "axeldibarra@gmail.com" ||
            userEmail === "luciazruocco@gmail.com") && (
            <div className="glass-card p-6 space-y-4 border-l-4 border-l-amber-500 mb-6 bg-amber-50/30">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-800 flex items-center gap-2">
                <Lock className="h-4 w-4" /> Funciones Experimentales
              </h3>
              <p className="text-[10px] text-amber-600 font-medium">
                Activar el Debug Mode permite ver y modificar registros
                directamente en la base de datos de producción (usar con
                precaución).
              </p>
              <button
                id="btn-auto-20-moved"
                onClick={() => {
                  if (!isDebugMode) {
                    if (!twoFactorSecret) {
                      const secret = authenticator.generateSecret();
                      setPromptConfig({
                        isOpen: true,
                        title:
                          "Configurar 2FA (Escanea el QR e ingresa el código):",
                        value: "",
                        inputType: "text",
                        qrSecret: secret,
                        onSubmit: (val: string) => {
                          if (authenticator.check(val, secret)) {
                            setTwoFactorSecret(secret);
                            setIsDebugMode(true);
                            showAlert("2FA configurado y Debug Mode activado");
                          } else {
                            showAlert("Código incorrecto");
                          }
                        },
                      });
                    } else {
                      setPromptConfig({
                        isOpen: true,
                        title: "Ingrese código 2FA:",
                        value: "",
                        inputType: "text",
                        onSubmit: (val: string) => {
                          if (authenticator.check(val, twoFactorSecret)) {
                            setIsDebugMode(true);
                          } else {
                            showAlert("Código incorrecto");
                          }
                        },
                      });
                    }
                  } else {
                    setIsDebugMode(false);
                  }
                }}
                className={cn(
                  "mt-2 px-4 py-3 w-full text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border",
                  isDebugMode
                    ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                )}
              >
                {isDebugMode
                  ? "🛠️ Desactivar Debug Mode"
                  : "🛠️ Activar Debug Mode"}
              </button>
            </div>
          )}

          <div className="glass-card p-6 space-y-4 border-l-4 border-l-indigo-500">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-4">
              <Settings className="h-4 w-4 text-indigo-500" /> Preferencias
              Locales
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/80 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">
                    Consola de Depuración
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Muestra los logs y el estado en pantalla.
                  </span>
                </div>
                {renderSwitch(
                  localDevSettings.showConsole,
                  (val) => setLocalDevSettings((p) => ({ ...p, showConsole: val })),
                  "bg-indigo-600"
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/80 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">
                    Estadísticas de Firebase
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Panel local con lecturas/escrituras.
                  </span>
                </div>
                {renderSwitch(
                  localDevSettings.showFirebaseStats,
                  (val) => setLocalDevSettings((p) => ({ ...p, showFirebaseStats: val })),
                  "bg-indigo-600"
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/80 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">
                    Notificaciones de Sincronización
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Toast global al modificar datos.
                  </span>
                </div>
                {renderSwitch(
                  localDevSettings.showToasts,
                  (val) => setLocalDevSettings((p) => ({ ...p, showToasts: val })),
                  "bg-indigo-600"
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/80 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    Inspector de Keys Duplicadas (React)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Panel flotante para detectar en tiempo real `key`s o IDs duplicados en pantalla.
                  </span>
                </div>
                {renderSwitch(
                  !!localDevSettings.showKeyInspector,
                  (val) => setLocalDevSettings((p) => ({ ...p, showKeyInspector: val })),
                  "bg-indigo-600"
                )}
              </div>
            </div>
          </div>

          {/* Panel de Testing de Notificaciones por Tipo */}
          <div className="glass-card p-6 space-y-4 border-l-4 border-l-purple-500">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-purple-500" /> Probador de Notificaciones por Tipo
            </h3>
            <p className="text-[10px] font-medium text-slate-500 mb-4">
              Haz clic en cualquiera de las siguientes alertas para simular cómo se enviará y visualizará en el sistema:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={async () => {
                  const title = "Cierre: BAFICI 2026";
                  const body = "Quedan 2 días para el cierre de inscripciones.";
                  if ("Notification" in window && Notification.permission === "granted") {
                    if ("serviceWorker" in navigator) {
                      const reg = await navigator.serviceWorker.ready;
                      reg.showNotification(title, { body, icon: "/images/favicon.png" });
                    } else {
                      new Notification(title, { body, icon: "/images/favicon.png" });
                    }
                  }
                  showAlert("Notificación Simulada", title);
                }}
                className="p-3 bg-indigo-50/60 border border-indigo-100 hover:bg-indigo-100/80 text-indigo-900 rounded-xl text-left transition-all flex items-start gap-2.5 active:scale-98 cursor-pointer"
              >
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5">
                  <Bell className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-indigo-950">1. Fechas de Cierre</div>
                  <div className="text-[10px] font-medium text-indigo-700/80 mt-0.5">Cierre: [Nombre del festival]</div>
                </div>
              </button>

              <button
                onClick={async () => {
                  const title = "Anuncio: Festival de Cannes";
                  const body = "Mañana se publican las selecciones oficiales.";
                  if ("Notification" in window && Notification.permission === "granted") {
                    if ("serviceWorker" in navigator) {
                      const reg = await navigator.serviceWorker.ready;
                      reg.showNotification(title, { body, icon: "/images/favicon.png" });
                    } else {
                      new Notification(title, { body, icon: "/images/favicon.png" });
                    }
                  }
                  showAlert("Notificación Simulada", title);
                }}
                className="p-3 bg-amber-50/60 border border-amber-100 hover:bg-amber-100/80 text-amber-900 rounded-xl text-left transition-all flex items-start gap-2.5 active:scale-98 cursor-pointer"
              >
                <div className="p-1.5 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-amber-950">2. Fechas de Novedades</div>
                  <div className="text-[10px] font-medium text-amber-700/80 mt-0.5">Anuncio: [Nombre del festival]</div>
                </div>
              </button>

              <button
                onClick={async () => {
                  const title = "Estado: San Sebastián";
                  const body = "¡Seleccionado en Competencia Oficial!";
                  if ("Notification" in window && Notification.permission === "granted") {
                    if ("serviceWorker" in navigator) {
                      const reg = await navigator.serviceWorker.ready;
                      reg.showNotification(title, { body, icon: "/images/favicon.png" });
                    } else {
                      new Notification(title, { body, icon: "/images/favicon.png" });
                    }
                  }
                  showAlert("Notificación Simulada", title);
                }}
                className="p-3 bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-100/80 text-emerald-900 rounded-xl text-left transition-all flex items-start gap-2.5 active:scale-98 cursor-pointer"
              >
                <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-emerald-950">3. Cambio de Estado</div>
                  <div className="text-[10px] font-medium text-emerald-700/80 mt-0.5">Estado: [Nombre del festival]</div>
                </div>
              </button>

              <button
                onClick={async () => {
                  const title = "🎂 Cumpleaños: Lucia Ruocco";
                  const body = "¡Hoy es el cumpleaños de Lucia!";
                  if ("Notification" in window && Notification.permission === "granted") {
                    if ("serviceWorker" in navigator) {
                      const reg = await navigator.serviceWorker.ready;
                      reg.showNotification(title, { body, icon: "/images/favicon.png" });
                    } else {
                      new Notification(title, { body, icon: "/images/favicon.png" });
                    }
                  }
                  showAlert("Notificación Simulada", title);
                }}
                className="p-3 bg-rose-50/60 border border-rose-100 hover:bg-rose-100/80 text-rose-900 rounded-xl text-left transition-all flex items-start gap-2.5 active:scale-98 cursor-pointer"
              >
                <div className="p-1.5 bg-rose-500 text-white rounded-lg shrink-0 mt-0.5">
                  <Bell className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-rose-950">4. Cumpleaños</div>
                  <div className="text-[10px] font-medium text-rose-700/80 mt-0.5">🎂 Cumpleaños: [Nombre]</div>
                </div>
              </button>

              <button
                onClick={async () => {
                  const title = "📌 BAFICI 2026";
                  const body = "Enviar DCP a distribuidor";
                  if ("Notification" in window && Notification.permission === "granted") {
                    if ("serviceWorker" in navigator) {
                      const reg = await navigator.serviceWorker.ready;
                      reg.showNotification(title, { body, icon: "/images/favicon.png" });
                    } else {
                      new Notification(title, { body, icon: "/images/favicon.png" });
                    }
                  }
                  showAlert("Notificación Simulada", title);
                }}
                className="p-3 bg-purple-50/60 border border-purple-100 hover:bg-purple-100/80 text-purple-900 rounded-xl text-left transition-all flex items-start sm:col-span-2 gap-2.5 active:scale-98 cursor-pointer"
              >
                <div className="p-1.5 bg-purple-600 text-white rounded-lg shrink-0 mt-0.5">
                  <Bell className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-purple-950">5. Tarea Pendiente</div>
                  <div className="text-[10px] font-medium text-purple-700/80 mt-0.5">📌 [Nombre del Festival] - Subtítulo: Descripción de la tarea</div>
                </div>
              </button>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" /> Métricas de
                Firebase (Estimadas)
              </h3>
              <button
                onClick={() => {
                  resetFirestoreReads();
                  resetFirestoreWrites();
                }}
                className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Resetear
              </button>
            </div>

            <div className="space-y-3">
              {/* Reads */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-sm font-bold text-slate-700 mb-1">
                  Unidades de lectura
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  Se ha usado un{" "}
                  {Math.min(100, (reads / 50000) * 100).toFixed(1)}% de límite
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-xl font-black text-slate-800">
                    {reads >= 1000 ? (reads / 1000).toFixed(1) + " k" : reads}
                  </span>
                  {reads > 50000 && (
                    <span className="text-xs text-red-500 font-bold mb-1">
                      (se superó la cuota sin costo por {reads - 50000})
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">50 k por día</div>
              </div>

              {/* Writes */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-sm font-bold text-slate-700 mb-1">
                  Unidades de escritura
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  Se ha usado un{" "}
                  {Math.min(100, (writes / 40000) * 100).toFixed(1)}% de límite
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-xl font-black text-slate-800">
                    {writes >= 1000
                      ? (writes / 1000).toFixed(1) + " k"
                      : writes}
                  </span>
                  {writes > 40000 && (
                    <span className="text-xs text-red-500 font-bold mb-1">
                      (se superó la cuota sin costo por {writes - 40000})
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">40 k por día</div>
              </div>

              {/* Realtime Reads */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="text-sm font-bold text-slate-700 mb-1">
                  Unidades de lectura en tiempo real
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  Se ha usado un{" "}
                  {Math.min(100, (reads / 50000) * 100).toFixed(1)}% de límite
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-xl font-black text-slate-800">
                    {reads >= 1000 ? (reads / 1000).toFixed(1) + " k" : reads}
                  </span>
                </div>
                <div className="text-xs text-slate-400">50 k en total</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4 border-l-4 border-l-amber-500">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
              Entorno de Pruebas Aislado (Offline)
            </h3>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Trabaja localmente sin conectarte a Firestore para evitar consumir
              cuota. Los datos se guardarán en tu navegador (localStorage).
            </p>
            <button
              onClick={toggleLocalMode}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                isLocalMode
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200",
              )}
            >
              {isLocalMode
                ? "Desactivar Entorno Aislado"
                : "Activar Entorno Aislado"}
            </button>
            {isLocalMode && (
              <p className="text-[10px] text-red-500 font-bold mt-2">
                ⚠️ Entorno de Pruebas Activo. Los datos no se sincronizarán con
                los demás miembros.
              </p>
            )}
          </div>

          <div className="glass-card p-6 space-y-4 border-l-4 border-l-red-500">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
              <Bug className="h-4 w-4 text-red-500" /> Herramientas de Testing
            </h3>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-4">
              Utilitarios para simular escenarios y probar la pantalla de error general.
            </p>
            
            <div className="space-y-4">
              <div className="bg-white/50 rounded-xl p-4 border border-slate-100 shadow-sm">
                <h4 className="text-[10px] font-bold text-slate-700 mb-3 uppercase tracking-wider">Forzar Crash por Componente (Error Boundary)</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Dashboard", view: "dashboard", section: "Dashboard" },
                    { label: "Ficha Técnica", view: "film_data", section: "Ficha Técnica" },
                    { label: "Festivales", view: "festivals", section: "Festivales" },
                    { label: "Tareas", view: "tasks", section: "Tareas" },
                    { label: "Calendario", view: "calendar", section: "Calendario" },
                    { label: "Estadísticas", view: "stats", section: "Estadísticas" },
                    { label: "Informes", view: "reports", section: "Informes" },
                    { label: "Galería", view: "gallery", section: "Galería" },
                    { label: "Bug Tracker", view: "bugs", section: "Bug Tracker" },
                    { label: "Manual de Ayuda", view: "help", section: "Manual de Ayuda" },
                    { label: "Secretos", view: "play_zone", section: "Secretos" },
                    { label: "Mapa de Arq", view: "architecture_map", section: "Mapa de Arquitectura" },
                  ].map((item, idx) => (
                    <button
                      key={`${item.view}-${idx}`}
                      onClick={() => {
                        localStorage.setItem("forceCrash", item.section);
                        setView(item.view as any);
                      }}
                      className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      {item.label}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setForceError(true)}
                    className="px-3 py-1.5 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm"
                  >
                    Crash en Configuración
                  </button>
                </div>
              </div>

              <div className="bg-white/50 rounded-xl p-4 border border-slate-100 shadow-sm">
                <h4 className="text-[10px] font-bold text-slate-700 mb-3 uppercase tracking-wider">Simulación de Eventos (Notificaciones)</h4>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const err = new CustomEvent("appError", {
                        detail: {
                          message: "Excepción de prueba simulada",
                          errorCode: "test_error_0x001",
                        },
                      });
                      window.dispatchEvent(err);
                    }}
                    className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                  >
                    Simular Error (Test)
                  </button>
                  <button
                    onClick={() => {
                      showAlert(
                        "Prueba de Notificación",
                        "Este es un mensaje de prueba con un supuesto código de error para ver cómo se ve el modal nuevo."
                      );
                    }}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg border border-indigo-200 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                  >
                    Notificación Modal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPlatformModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 relative space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsPlatformModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-50 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Settings className="h-5 w-5 text-rose-500" /> Registrar Plataforma
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                Añadir un nuevo canal de distribución
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Nombre de la Plataforma
                </label>
                <input
                  type="text"
                  value={newPlatformName}
                  onChange={(e) => setNewPlatformName(e.target.value)}
                  placeholder="Ej. Shortfilmdepot, FilmFreeway, etc."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Selecciona un ícono original / predeterminado
                </label>
                
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: "FileText", label: "Google Forms" },
                    { name: "Globe", label: "Web Oficial" },
                    { name: "Award", label: "FilmFreeway" },
                    { name: "Home", label: "FestHome" },
                    { name: "Inbox", label: "Shortfilmdepot" },
                    { name: "Film", label: "Cine / Film" },
                    { name: "Video", label: "Video" },
                    { name: "Sparkles", label: "Estrella" }
                  ].map((iconOpt, idx) => (
                    <button
                      key={`${iconOpt.name}-${idx}`}
                      onClick={() => setNewPlatformIcon(iconOpt.name)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5",
                        newPlatformIcon === iconOpt.name
                          ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20"
                          : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                      )}
                      title={iconOpt.label}
                    >
                      <PlatformIcon
                        iconName={iconOpt.name}
                        className={cn("h-4 w-4", newPlatformIcon === iconOpt.name ? "text-white" : "text-rose-500")}
                      />
                      <span className="text-[7px] uppercase font-black tracking-tight truncate max-w-full">
                        {iconOpt.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">O escribe un ícono de Lucide:</span>
                  <input
                    type="text"
                    value={newPlatformIcon}
                    onChange={(e) => setNewPlatformIcon(e.target.value)}
                    placeholder="Ej. HelpCircle, Heart, Film..."
                    className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-600 font-bold w-full focus:outline-none focus:ring-1 focus:ring-rose-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setIsPlatformModalOpen(false)}
                className="flex-1 py-3 border border-slate-100 hover:bg-slate-50 font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPlatform}
                className="flex-1 py-3 bg-slate-800 text-white hover:bg-slate-700 font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Autenticación de Dos Pasos (2FA) para Acceso a API Key Secreta */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    Autenticación de Dos Pasos (2FA)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Verificación de identidad para seguridad de clave API
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIs2FAModalOpen(false);
                  setPending2FAAction(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-bold text-[10px] uppercase text-slate-400">Acción Requerida:</span>
                <span className="font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                  {twoFactorActionTitle}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-bold text-[10px] uppercase text-slate-400">Cuenta de Usuario:</span>
                <span className="font-mono font-semibold text-[10px] text-slate-700">{userEmail || "admin@festis.app"}</span>
              </div>
            </div>

            {/* Instrucción de Verificación de Autenticador de 3ros / OTP */}
            <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/60 space-y-1.5 text-slate-700 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                <Smartphone className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Aplicación Autenticadora de 3ros (Google / Authy)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Abra su aplicación autenticadora (configurada en <span className="font-bold text-slate-800">General &gt; Seguridad y 2FA</span>) e ingrese la clave temporal de 6 dígitos. Si no tiene acceso a su app, solicite un código de recuperación por Email y SMS.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Código de Verificación (6 Dígitos):
              </label>
              <input
                type="text"
                maxLength={6}
                value={twoFactorInputCode}
                onChange={(e) => setTwoFactorInputCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleVerify2FA();
                }}
                placeholder="Ej. 849201"
                className="w-full text-center text-lg font-mono font-extrabold tracking-widest px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
            </div>

            {/* Opción de Recuperación por Email y SMS */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-slate-500">¿Perdiste tu app autenticadora?</span>
                <button
                  type="button"
                  disabled={isSendingRecovery}
                  onClick={handleSendRecoveryCode}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <Smartphone className="h-3.5 w-3.5" />
                  {isSendingRecovery ? "Enviando código..." : "Enviar código por Email & SMS"}
                </button>
              </div>

              {isRecoverySent && recoveryOtpCode && (
                <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Código enviado por Email y SMS</span>
                  </div>
                  <p className="text-[10px] text-indigo-700/90 leading-relaxed">
                    Se envió a <span className="font-bold">{userEmail}</span> y <span className="font-bold">{userPhone || "Celular registrado"}</span>. Código simulado: <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-950">{recoveryOtpCode}</span>.
                  </p>
                </div>
              )}
            </div>

            {twoFactorError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{twoFactorError}</span>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIs2FAModalOpen(false);
                  setPending2FAAction(null);
                }}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 font-bold rounded-2xl text-xs uppercase tracking-wider text-slate-600 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleVerify2FA}
                className="flex-1 py-3 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" /> Autorizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear/Editar Institución */}
      {isInstitutionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-500">
                  <Building className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    {editingInst ? "Editar Institución" : "Registrar Institución"}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {editingInst ? "Modificar los detalles de la institución" : "Añadir una nueva institución reguladora o escuela"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInstitutionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Nombre de la Institución *
                </label>
                <input
                  type="text"
                  value={instNombre}
                  onChange={(e) => setInstNombre(e.target.value)}
                  placeholder="Ej. ENERC, INCAA, FUC, etc."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Email de Contacto
                </label>
                <input
                  type="email"
                  value={instEmail}
                  onChange={(e) => setInstEmail(e.target.value)}
                  placeholder="Ej. contacto@institucion.gob.ar"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Persona o Área Responsable
                </label>
                <input
                  type="text"
                  value={instResponsable}
                  onChange={(e) => setInstResponsable(e.target.value)}
                  placeholder="Ej. Rectorado, Coordinación de Alumnos..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Notas / Descripción
                </label>
                <textarea
                  value={instNotas}
                  onChange={(e) => setInstNotas(e.target.value)}
                  placeholder="Notas internas o aclaraciones sobre su rol regulador..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setIsInstitutionModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 font-bold rounded-2xl text-[10px] uppercase tracking-widest text-slate-600 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingInstitution}
                onClick={handleSaveInstitution}
                className="flex-1 py-3 bg-rose-500 text-white hover:bg-rose-600 font-bold rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-md shadow-rose-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSavingInstitution ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
