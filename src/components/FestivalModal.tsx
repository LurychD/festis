import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Sparkles, AlertTriangle, FlaskConical, Clock } from "lucide-react";
import { Festival, FestivalStatus, Platform, StatusHistoryEntry, DistributionPlan } from "../types";
import { PlaceAutocomplete } from "./PlaceAutocomplete";
import { uploadFileToStorage } from "../utils/storageHelpers";
import { PlatformIcon } from "./PlatformIcon";
import {
  cn,
  formatDateForInput,
  formatDateTimeForInput,
} from "../utils/helpers";

interface FestivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalType: "create" | "edit" | "new_edition";
  selectedFestival: Festival | null;
  userName: string;
  isAuthorized: boolean;
  isDev?: boolean;
  festivals: Festival[];
  setFestivals: any;
  setSelectedFestival: (festival: Festival | null) => void;
  addAuditLog: (section: string, action: string) => void;
  showAlert: (message: string) => void;
  platforms?: Platform[];
  distributionPlans?: DistributionPlan[];
}

export const FestivalModal: React.FC<FestivalModalProps> = ({
  isOpen,
  onClose,
  modalType,
  selectedFestival,
  userName,
  isAuthorized,
  isDev = false,
  festivals,
  setFestivals,
  setSelectedFestival,
  addAuditLog,
  showAlert,
  platforms = [],
  distributionPlans = [],
}) => {
  // --- ESTADOS LOCALES DEL FORMULARIO Y SUBIDA ---
  const [projectionCoords, setProjectionCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [laurelBase64, setLaurelBase64] = useState<string>("");
  const [laurelBgColor, setLaurelBgColor] = useState<
    "transparent" | "white" | "black"
  >("transparent");
  const [isUploadingLaurel, setIsUploadingLaurel] = useState(false);

  const [countryVal, setCountryVal] = useState("");
  const [osmSuggestions, setOsmSuggestions] = useState<any[]>([]);
  const [isLoadingOsm, setIsLoadingOsm] = useState(false);
  const [selectedPlat, setSelectedPlat] = useState("");

  // Estados controlados para validación de formulario
  const [nameVal, setNameVal] = useState("");
  const [deadlineVal, setDeadlineVal] = useState("");
  const [newsVal, setNewsVal] = useState("");
  const [priceVal, setPriceVal] = useState("");
  const [linkVal, setLinkVal] = useState("");
  const [isPreliminaryVal, setIsPreliminaryVal] = useState(false);
  const [distributionPlanIdVal, setDistributionPlanIdVal] = useState("");

  // Modal de confirmación para festival de prueba (Detector "test" en rol dev)
  const [showTestConfirmModal, setShowTestConfirmModal] = useState(false);
  const [testCountdown, setTestCountdown] = useState(3);

  // Verificar si las Funciones Experimentales están activadas en Configuración
  const isExperimentalEnabled = React.useMemo(() => {
    try {
      const saved = localStorage.getItem("localDevSettings");
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.experimentalFeatures);
      }
    } catch (e) {}
    return false;
  }, [isOpen]);

  useEffect(() => {
    if (!showTestConfirmModal) return;
    setTestCountdown(3);
    const interval = setInterval(() => {
      setTestCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showTestConfirmModal]);

  const TEST_VECTOR_LAUREL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 350" width="500" height="350"><g fill="%23000000"><path d="M170,310 C130,260 100,180 110,100 C113,70 120,40 135,10 C125,35 118,65 115,95 C102,175 130,255 170,310 Z"/><path d="M120,30 C100,20 70,25 50,40 C70,45 95,45 115,35 Z"/><path d="M110,60 C85,50 55,55 35,75 C58,78 85,72 105,62 Z"/><path d="M102,95 C75,90 45,100 25,120 C50,118 78,110 98,98 Z"/><path d="M98,130 C70,130 42,142 25,165 C50,158 78,145 95,132 Z"/><path d="M100,165 C75,170 50,188 35,215 C58,202 84,185 100,168 Z"/><path d="M108,200 C85,210 62,232 50,260 C72,242 98,220 112,202 Z"/><path d="M122,235 C102,250 82,275 75,305 C95,282 118,258 128,238 Z"/><path d="M330,310 C370,260 400,180 390,100 C387,70 380,40 365,10 C375,35 382,65 385,95 C398,175 370,255 330,310 Z"/><path d="M380,30 C400,20 430,25 450,40 C430,45 405,45 385,35 Z"/><path d="M390,60 C415,50 445,55 465,75 C442,78 415,72 395,62 Z"/><path d="M398,95 C425,90 455,100 475,120 C450,118 422,110 402,98 Z"/><path d="M402,130 C430,130 458,142 475,165 C450,158 422,145 405,132 Z"/><path d="M400,165 C425,170 450,188 465,215 C442,202 416,185 400,168 Z"/><path d="M392,200 C415,210 438,232 450,260 C428,242 402,220 388,202 Z"/><path d="M378,235 C398,250 418,275 425,305 C405,282 382,258 372,238 Z"/></g><text x="250" y="110" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="18" letter-spacing="2" fill="%23000000">2026 OFFICIAL SELECTION</text><line x1="170" y1="125" x2="330" y2="125" stroke="%23000000" stroke-width="2"/><text x="250" y="170" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="28" letter-spacing="1" fill="%23000000">TEST FESTIVAL</text><text x="250" y="215" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="36" letter-spacing="2" fill="%23000000">2026</text></svg>`;

  const handleCreateTestFestival = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const testFestival: Festival = {
      id: `test-fest-${Date.now()}`,
      name: "Festival de Prueba (TEST)",
      country: "Argentina",
      type: "Internacional",
      status: FestivalStatus.POR_ENVIAR,
      deadline: todayStr,
      category: "Ficción / Experimental",
      nomination: "Cortometraje",
      platform: "FilmFreeway",
      price: "Gratis",
      fee: 0,
      link: "https://example.com/test-festival",
      observations: "Festival de prueba generado para verificación de sistema e inspección de funcionalidades.",
      tasks: [],
      laurel: TEST_VECTOR_LAUREL,
      laurelBg: "white",
      isTestFestival: true,
      includeInStats: false,
      statusHistory: [{
        id: Date.now().toString(),
        status: FestivalStatus.POR_ENVIAR,
        timestamp: new Date().toISOString(),
        updatedBy: userName,
        note: "Creado automáticamente como festival de prueba de desarrollador"
      }],
      createdBy: userName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setFestivals([testFestival, ...festivals]);
    setSelectedFestival(testFestival);
    addAuditLog("festivals", `${userName} creó un festival de prueba interactivo.`);
    setShowTestConfirmModal(false);
    onClose();
    showAlert("¡Festival de prueba creado exitosamente!");
  };

  const handleCountryChange = async (val: string) => {
    setCountryVal(val);
    if (val.trim().length < 3) {
      setOsmSuggestions([]);
      return;
    }
    setIsLoadingOsm(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          val
        )}&addressdetails=1&limit=5`,
        {
          headers: {
            "User-Agent": "FestisFestivalPlanner/1.0"
          }
        }
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        const formatted = data.map((item: any) => {
          const addr = item.address || {};
          const city = addr.city || addr.town || addr.village || addr.municipality || addr.city_district || addr.suburb || "";
          const state = addr.state || addr.region || addr.county || "";
          const country = addr.country || "";
          
          const parts = [city, state, country].map(p => p.trim()).filter(Boolean);
          const formattedString = parts.join(", ");
          return {
            display: formattedString,
            original: item
          };
        }).filter(item => item.display.length > 0);
        
        const unique = formatted.filter((v, i, a) => a.findIndex(t => t.display === v.display) === i);
        setOsmSuggestions(unique);
      }
    } catch (error) {
      console.error("Error fetching from OSM:", error);
    } finally {
      setIsLoadingOsm(false);
    }
  };

  // Estado de confirmación obligatorio para nueva edición
  const [newEditionCheckbox, setNewEditionCheckbox] = useState(false);

  // Efecto para inicializar estados basados en la acción (crear, editar o nueva edición)
  useEffect(() => {
    if (isOpen) {
      setNewEditionCheckbox(false);
      if (modalType === "edit" && selectedFestival) {
        setLaurelBase64(selectedFestival.laurel || "");
        setLaurelBgColor(
          (selectedFestival.laurelBg as "transparent" | "white" | "black") ||
            "transparent"
        );
        setCountryVal(selectedFestival.country || "");
        setSelectedPlat(selectedFestival.platform || (platforms[0]?.name || ""));
        setNameVal(selectedFestival.name || "");
        setDeadlineVal(formatDateForInput(selectedFestival.deadline) || "");
        setNewsVal(formatDateForInput(selectedFestival.newsDate) || "");
        setPriceVal(selectedFestival.price || "");
        setLinkVal(selectedFestival.link || "");
        setIsPreliminaryVal(selectedFestival.isPreliminary || false);
        setDistributionPlanIdVal(selectedFestival.distributionPlanId || "");
        if (selectedFestival.projectionLat && selectedFestival.projectionLng) {
          setProjectionCoords({
            lat: selectedFestival.projectionLat,
            lng: selectedFestival.projectionLng,
          });
        } else {
          setProjectionCoords(null);
        }
      } else if (modalType === "new_edition" && selectedFestival) {
        // Inicializar datos precargados para Nueva Edición
        setLaurelBase64(selectedFestival.laurel || "");
        setLaurelBgColor((selectedFestival.laurelBg as any) || "transparent");
        setCountryVal(selectedFestival.country || "");
        setSelectedPlat(selectedFestival.platform || (platforms[0]?.name || ""));
        
        // Si el nombre tiene un año, incrementarlo, o dejar el nombre base
        const currentYear = new Date().getFullYear();
        let nextName = selectedFestival.name || "";
        if (/\d{4}/.test(nextName)) {
          nextName = nextName.replace(/\d{4}/, (m) => (parseInt(m, 10) + 1).toString());
        } else {
          nextName = `${nextName} ${currentYear}`;
        }
        setNameVal(nextName);
        
        // Limpiar fechas anteriores para que se ingresen las nuevas
        setDeadlineVal("");
        setNewsVal("");
        setPriceVal(selectedFestival.price || "Gratis");
        setLinkVal(selectedFestival.link || "");
        setIsPreliminaryVal(selectedFestival.isPreliminary || false);
        setDistributionPlanIdVal(selectedFestival.distributionPlanId || "");
        setProjectionCoords(null);
      } else {
        // Reiniciar estados para un nuevo festival
        setLaurelBase64("");
        setLaurelBgColor("transparent");
        setCountryVal("");
        setProjectionCoords(null);
        setSelectedPlat(platforms[0]?.name || "");
        setNameVal("");
        setDeadlineVal("");
        setNewsVal("");
        setPriceVal("");
        setLinkVal("");
        setIsPreliminaryVal(false);
        setDistributionPlanIdVal("");
      }
      setOsmSuggestions([]);
    }
  }, [isOpen, modalType, selectedFestival, platforms]);

  // Validaciones en tiempo real
  const todayStr = new Date().toISOString().split("T")[0];
  const isDeadlineInPast = Boolean(deadlineVal.trim() && deadlineVal < todayStr);
  const isNewsBeforeDeadline = Boolean(
    deadlineVal && newsVal && new Date(newsVal) < new Date(deadlineVal)
  );
  const isLinkWithoutProtocol = Boolean(
    linkVal.trim() && !/^https?:\/\//i.test(linkVal.trim())
  );
  const isPriceNegative = Boolean(
    priceVal.trim() && !isNaN(Number(priceVal)) && Number(priceVal) < 0
  );

  const isFormInvalid = 
    !nameVal.trim() || 
    !deadlineVal.trim() || 
    isPriceNegative || 
    (modalType === "new_edition" && !newEditionCheckbox);

  const missingFields: string[] = [];
  if (!nameVal.trim()) missingFields.push("nombre");
  if (!deadlineVal.trim()) missingFields.push("cierre");
  if (isPriceNegative) missingFields.push("precio válido");
  if (modalType === "new_edition" && !newEditionCheckbox) missingFields.push("marcar casilla de confirmación");

  const missingMsg = missingFields.length > 0
    ? `*Falta ${missingFields.join(missingFields.length === 2 ? " y " : ", ")}`
    : "";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Fondo difuminado interactivo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#e91e63]/40 backdrop-blur-md"
      />

      {/* Contenedor principal de la tarjeta del modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Cabecera del modal */}
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              {modalType === "create"
                ? "Nuevo Festival"
                : modalType === "new_edition"
                ? "Nueva Edición"
                : "Editar Festival"}
            </h2>
            {modalType === "new_edition" && selectedFestival && (
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                Apertura de nueva edición basada en: {selectedFestival.name}
              </p>
            )}
          </div>
          <button
            id="btn-close-festival-modal"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 hover:text-slate-900"
          >
            <X className="h-7 w-7" />
          </button>
        </div>

        {/* Cuerpo con scroll del modal */}
        <div className="p-8 overflow-y-auto space-y-6">
          {/* Banner y Checkbox obligatorio para Nueva Edición */}
          {modalType === "new_edition" && selectedFestival && (
            <div className="bg-emerald-50 border-2 border-emerald-200 p-5 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-emerald-900 leading-relaxed">
                Estás creando una nueva edición vinculada a <strong>"{selectedFestival.name}"</strong>. Se conservará el registro histórico y la información técnica anterior.
              </p>
              <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-emerald-200 cursor-pointer" onClick={() => setNewEditionCheckbox(!newEditionCheckbox)}>
                <input
                  type="checkbox"
                  id="chk-new-edition-modal"
                  checked={newEditionCheckbox}
                  onChange={(e) => setNewEditionCheckbox(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="chk-new-edition-modal" className="text-xs font-bold text-emerald-900 cursor-pointer select-none leading-snug">
                  Voy a abrir una nueva edición de {selectedFestival.name} y soy consciente de que esta acción no se puede deshacer.
                </label>
              </div>
            </div>
          )}
          {/* Autocompletar Inteligente con IA (Solo para creación de festivales con Funciones Experimentales) */}
          {modalType === "create" && isExperimentalEnabled && (
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col gap-2 relative">
              <span className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-bl-lg rounded-tr-xl">
                Beta
              </span>
              <label className="text-xs font-bold text-indigo-600 ml-1 block">
                <Sparkles className="w-3.5 h-3.5 inline pb-0.5 mr-1" />
                Autocompletar Inteligente
              </label>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  id="m-auto-parse"
                  placeholder="Pega un Link (ej. FilmFreeway) o un pedazo de texto..."
                  className="flex-1 border-2 border-indigo-100 focus:border-indigo-400 bg-white px-3 py-2 text-sm rounded-xl outline-none"
                />

                <label className="cursor-pointer px-4 py-2 bg-white text-indigo-600 border-2 border-indigo-100 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                  <input
                    type="file"
                    id="m-file-upload"
                    className="hidden"
                    accept="*/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const input = document.getElementById(
                          "m-auto-parse"
                        ) as HTMLInputElement;
                        if (input)
                          input.value = `Archivo seleccionado: ${file.name}`;
                      }
                    }}
                  />
                  📁 Subir Archivo
                </label>

                <button
                  onClick={async (e) => {
                    const btn = e.currentTarget;
                    const input = document.getElementById(
                      "m-auto-parse"
                    ) as HTMLInputElement;
                    const fileInput = document.getElementById(
                      "m-file-upload"
                    ) as HTMLInputElement;
                    const file = fileInput?.files?.[0];

                    if (!input.value.trim() && !file) return;

                    let textOrUrl = input.value.trim();
                    if (file) textOrUrl = ""; // Priorizar archivo si existe

                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = "✨ Procesando...";
                    btn.disabled = true;

                    try {
                      let payload: any = { textOrUrl };

                      if (file) {
                        // Conversión del archivo a base64
                        const reader = new FileReader();
                        const base64Promise = new Promise((resolve, reject) => {
                          reader.onload = () =>
                            resolve((reader.result as string).split(",")[1]);
                          reader.onerror = (error) => reject(error);
                          reader.readAsDataURL(file);
                        });
                        const base64Data = await base64Promise;
                        payload = {
                          textOrUrl: "",
                          fileName: file.name,
                          mimeType: file.type,
                          fileBase64: base64Data,
                        };
                      }

                      const res = await fetch("/api/parse-festival", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      });
                      const data = await res.json();

                      if (data.success && data.festival) {
                        const f = data.festival;
                        const fill = (id: string, val: string | undefined) => {
                          if (val && document.getElementById(id)) {
                            (
                              document.getElementById(id) as HTMLInputElement
                            ).value = val;
                            const event = new Event("change", {
                              bubbles: true,
                            });
                            document.getElementById(id)?.dispatchEvent(event);
                          }
                        };
                        if (f.name) { fill("m-name", f.name); setNameVal(f.name); }
                        if (f.country) { fill("m-country", f.country); setCountryVal(f.country); }
                        if (f.deadline) { fill("m-deadline", f.deadline); setDeadlineVal(f.deadline); }
                        if (f.newsDate) { fill("m-news", f.newsDate); setNewsVal(f.newsDate); }
                        if (f.category) fill("m-cat", f.category);
                        if (f.platform) fill("m-plat", f.platform);
                        if (f.price) { fill("m-price", f.price); setPriceVal(f.price); }
                        if (f.link) { fill("m-link", f.link); setLinkVal(f.link); }
                        if (f.observations) fill("m-obs", f.observations);
                      } else {
                        showAlert(
                          "No se pudo interpretar el formato o ocurrió un error: " +
                            (data.error || "")
                        );
                      }
                    } catch (err) {
                      showAlert("Error de red: " + (err as any).message);
                    } finally {
                      btn.innerHTML = originalHtml;
                      btn.disabled = false;
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Rellenar campos
                </button>
              </div>
              <p className="text-[10px] text-indigo-400 mt-1 opacity-80">
                * Esto es solo una herramienta de asistencia. La IA puede
                cometer errores. Por favor verifica los datos.
              </p>
            </div>
          )}

          {/* Nombre y Ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                {(isDev || isAuthorized) && nameVal.trim().toLowerCase().includes("test") && (
                  <button
                    type="button"
                    onClick={() => setShowTestConfirmModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-indigo-400"
                    title="Haz clic para crear un Festival de Prueba interactivo"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-indigo-200 animate-bounce" />
                    <span>🧪 Test Badge (Crear Festi)</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                id="m-name"
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                placeholder={isDev || isAuthorized ? "Escribe test" : "Nombre del festival"}
                className={cn(
                  "glass-input w-full border-2 focus:border-[#e91e63] bg-white/50",
                  !nameVal.trim() ? "border-amber-300 bg-amber-50/20" : "border-slate-200"
                )}
              />
              {!nameVal.trim() && (
                <span className="text-[10px] text-amber-600 font-semibold block mt-0.5 ml-1">
                  El nombre del festival es obligatorio
                </span>
              )}
            </div>
            <div className="space-y-1 relative" id="country-autocomplete-container">
              <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
                País / Ciudad (Ciudad, Provincia, País)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="m-country"
                  value={countryVal}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  onBlur={() => {
                    setTimeout(() => setOsmSuggestions([]), 250);
                  }}
                  placeholder="Buscar ciudad, provincia, país..."
                  className="glass-input w-full border-2 border-slate-200 focus:border-[#e91e63] bg-white/50 pr-8"
                  autoComplete="off"
                />
                {isLoadingOsm && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#e91e63]"></span>
                  </span>
                )}
              </div>
              
              {osmSuggestions.length > 0 && (
                <div className="absolute z-[99] left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {osmSuggestions.map((s, index) => (
                    <button
                      key={`osm-sug-${index}-${s.display}`}
                      type="button"
                      onClick={() => {
                        setCountryVal(s.display);
                        setOsmSuggestions([]);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-pink-50 hover:text-[#e91e63] font-medium transition-colors"
                    >
                      {s.display}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tipo y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
                Tipo
              </label>
              <select
                id="m-type"
                defaultValue={
                  modalType === "edit"
                    ? selectedFestival?.type
                    : "Festival🎬"
                }
                className="glass-input w-full border-2 border-slate-200 focus:border-[#e91e63] bg-white/50"
              >
                <option value="Festival🎬">Festival🎬</option>
                <option value="Premios🏆">Premios🏆</option>
                <option value="Muestra🎞️">Muestra🎞️</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
                Estado
              </label>
              <select
                id="m-status"
                defaultValue={
                  modalType === "edit"
                    ? selectedFestival?.status
                    : FestivalStatus.POR_ENVIAR
                }
                className="glass-input w-full border-2 border-slate-200 focus:border-[#e91e63] bg-white/50"
              >
                {Object.values(FestivalStatus).map((s, idx) => (
                  <option key={`${s}-${idx}`} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
                Nota / Motivo del Cambio de Estado (Opcional)
              </label>
              <input
                type="text"
                id="m-status-note"
                placeholder="Ej: Confirmación recibida por email, fee pagado de $15, etc."
                className="glass-input w-full border-2 border-slate-200 focus:border-[#e91e63] bg-white/50 text-xs"
              />
            </div>
          </div>

          {/* Cierre y Noticia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
                Cierre <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="m-deadline"
                value={deadlineVal}
                onChange={(e) => setDeadlineVal(e.target.value)}
                className={cn(
                  "glass-input w-full border-2 focus:border-[#e91e63] bg-white/50",
                  !deadlineVal.trim()
                    ? "border-amber-300 bg-amber-50/20"
                    : isDeadlineInPast
                    ? "border-amber-400 bg-amber-50/20"
                    : "border-slate-200"
                )}
              />
              {!deadlineVal.trim() && (
                <span className="text-[10px] text-amber-600 font-semibold block mt-0.5 ml-1">
                  La fecha de cierre es obligatoria
                </span>
              )}
              {deadlineVal.trim() && isDeadlineInPast && (
                <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2 mt-1.5 flex items-start gap-1.5 font-medium shadow-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    La fecha de cierre es anterior al día de hoy. Puedes ingresarla de todas formas.
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
                Noticia / Notificación
              </label>
              <input
                type="date"
                id="m-news"
                value={newsVal}
                onChange={(e) => setNewsVal(e.target.value)}
                className={cn(
                  "glass-input w-full border-2 focus:border-[#e91e63] bg-white/50",
                  isNewsBeforeDeadline ? "border-amber-400 bg-amber-50/40" : "border-slate-200"
                )}
              />
              {isNewsBeforeDeadline && (
                <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2 mt-1.5 flex items-start gap-1.5 font-medium shadow-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    La fecha de Noticia es previa a la fecha de Cierre. Verifica si el orden de las fechas es correcto.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Categoría y Nominación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
                Categoría
              </label>
              <input
                type="text"
                id="m-cat"
                defaultValue={
                  modalType === "edit" ? selectedFestival?.category : ""
                }
                className="glass-input w-full border-2 border-slate-200 focus:border-[#e91e63] bg-white/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
                Nominación
              </label>
              <input
                type="text"
                id="m-nom"
                defaultValue={
                  modalType === "edit" ? selectedFestival?.nomination : ""
                }
                className="glass-input w-full border-2 border-slate-200 focus:border-[#e91e63] bg-white/50"
              />
            </div>
          </div>

          {/* Plataforma y Precio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
                Plataforma
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-rose-500">
                  <PlatformIcon
                    iconName={platforms.find((p) => p.name === selectedPlat)?.icon || "Globe"}
                    className="h-4 w-4"
                  />
                </div>
                <select
                  id="m-plat"
                  value={selectedPlat}
                  onChange={(e) => setSelectedPlat(e.target.value)}
                  className="glass-input w-full border-2 border-slate-200 focus:border-[#e91e63] bg-white/50 pl-11"
                >
                  {platforms.map((plat, idx) => (
                    <option key={`${plat.id}-${idx}`} value={plat.name}>
                      {plat.name}
                    </option>
                  ))}
                  {selectedFestival?.platform &&
                    !platforms.some((p) => p.name === selectedFestival.platform) && (
                      <option value={selectedFestival.platform}>
                        {selectedFestival.platform}
                      </option>
                    )}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
                Precio / Fee
              </label>
              <input
                type="text"
                id="m-price"
                value={priceVal}
                onChange={(e) => setPriceVal(e.target.value)}
                placeholder="Ej: $25 USD o Gratis"
                className={cn(
                  "glass-input w-full border-2 focus:border-[#e91e63] bg-white/50",
                  isPriceNegative ? "border-red-400 bg-red-50/40" : "border-slate-200"
                )}
              />
              {isPriceNegative && (
                <span className="text-[10px] text-red-600 font-bold block mt-0.5 ml-1">
                  El precio no puede ser un valor negativo.
                </span>
              )}
            </div>
          </div>

          {/* Link Oficial */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
              Link Oficial
            </label>
            <input
              type="text"
              id="m-link"
              value={linkVal}
              onChange={(e) => setLinkVal(e.target.value)}
              placeholder="https://www.ejemplo.com"
              className="glass-input w-full border-2 border-slate-200 focus:border-[#e91e63] bg-white/50"
            />
            {isLinkWithoutProtocol && (
              <span className="text-[10px] text-amber-600 font-medium block mt-0.5 ml-1">
                💡 Recuerda incluir <code className="bg-amber-100 px-1 rounded">https://</code> para que el enlace sea interactivo.
              </span>
            )}
          </div>

          {/* Proyección y Ubicación en Mapa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
                Proyección
              </label>
              <input
                type="datetime-local"
                id="m-pdate"
                defaultValue={
                  modalType === "edit"
                    ? formatDateTimeForInput(selectedFestival?.projectionDate)
                    : ""
                }
                className="glass-input w-full border-2 border-slate-200 focus:border-[#e91e63] bg-white/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
                Lugar de Proyección
              </label>
              <div className="flex gap-2">
                <PlaceAutocomplete
                  id="m-ploc"
                  defaultValue={
                    modalType === "edit"
                      ? selectedFestival?.projectionLocation
                      : ""
                  }
                  className="glass-input w-full border-2 border-slate-200 focus:border-[#e91e63] bg-white/50"
                  onPlaceSelect={(place) => {
                    if (place && typeof place.lat === "number") {
                      setProjectionCoords({
                        lat: place.lat,
                        lng: place.lng,
                      });
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Laurel (Imagen) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
              Laurel (Imagen)
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={isUploadingLaurel}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setIsUploadingLaurel(true);
                  try {
                    const url = await uploadFileToStorage(
                      file,
                      `laureles/${Date.now()}_${file.name}`
                    );
                    setLaurelBase64(url);
                    showAlert("Laurel subido correctamente.");
                  } catch (err: any) {
                    console.error("Error subiendo laurel:", err);
                    showAlert(
                      "Error al subir laurel: " + (err.message || "Desconocido")
                    );
                  } finally {
                    setIsUploadingLaurel(false);
                  }
                }
              }}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 disabled:opacity-50"
            />
            {isUploadingLaurel && (
              <p className="text-xs text-amber-600 font-bold ml-2">
                Subiendo laurel...
              </p>
            )}
            {laurelBase64 && (
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLaurelBgColor("transparent")}
                    className={`px-2 py-1 text-xs rounded border ${laurelBgColor === "transparent" ? "bg-slate-200 border-slate-400 font-bold" : "bg-white border-slate-200"}`}
                  >
                    Transparente
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaurelBgColor("white")}
                    className={`px-2 py-1 text-xs rounded border ${laurelBgColor === "white" ? "bg-slate-200 border-slate-400 font-bold" : "bg-white border-slate-200"}`}
                  >
                    Blanco
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaurelBgColor("black")}
                    className={`px-2 py-1 text-xs rounded border ${laurelBgColor === "black" ? "bg-slate-200 border-slate-400 font-bold" : "bg-white border-slate-200"}`}
                  >
                    Negro
                  </button>
                </div>
                <div
                  className="relative inline-block border border-slate-200 rounded p-2"
                  style={{
                    backgroundColor:
                      laurelBgColor === "white"
                        ? "#ffffff"
                        : laurelBgColor === "black"
                          ? "#000000"
                          : "transparent",
                  }}
                >
                  <img
                    src={laurelBase64}
                    alt="Laurel preview"
                    className="h-16 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLaurelBase64("");
                      setLaurelBgColor("transparent");
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Plan de Distribución */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Plan de Distribución
            </h4>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="m-is-preliminary"
                checked={isPreliminaryVal}
                onChange={(e) => setIsPreliminaryVal(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
              />
              <label htmlFor="m-is-preliminary" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                Festival Preliminar (Análisis de viabilidad previo)
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
                Asociar a un Plan de Distribución
              </label>
              <select
                id="m-distribution-plan"
                value={distributionPlanIdVal}
                onChange={(e) => setDistributionPlanIdVal(e.target.value)}
                className="glass-input w-full border-2 border-slate-200 focus:border-[#e91e63] bg-white"
              >
                <option value="">-- No asociado --</option>
                {distributionPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre} ({plan.institucionNombre})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 ml-1 block mb-1">
              Observaciones / Notas
            </label>
            <textarea
              id="m-obs"
              defaultValue={
                modalType === "edit" ? selectedFestival?.observations : ""
              }
              className="glass-input w-full h-24 pt-4 border-2 border-slate-200 focus:border-[#e91e63] bg-white/50"
            ></textarea>
          </div>
        </div>

        {/* Botón de guardar/actualizar */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            id="btn-save-festival-modal"
            onClick={() => {
              if (!isAuthorized) {
                showAlert("No tienes permisos para realizar esta acción.");
                return;
              }
              const getVal = (id: string) =>
                (
                  document.getElementById(id) as
                    | HTMLInputElement
                    | HTMLSelectElement
                ).value;
              const name = getVal("m-name") || nameVal;

              // Detector de festival de prueba ("test") para desarrollador
              if (
                modalType === "create" &&
                (isDev || isAuthorized) &&
                name.trim().toLowerCase().includes("test")
              ) {
                setShowTestConfirmModal(true);
                return;
              }

              const deadline = getVal("m-deadline") || deadlineVal;
              if (!name.trim() || !deadline.trim()) {
                showAlert("Por favor, completa los campos obligatorios (Nombre y Fecha de Cierre).");
                return;
              }

              if (isPriceNegative) {
                showAlert("El precio no puede ser un valor negativo.");
                return;
              }

              let rawLink = getVal("m-link") || linkVal;
              if (rawLink.trim() && !/^https?:\/\//i.test(rawLink.trim())) {
                rawLink = `https://${rawLink.trim()}`;
              }

              const data: Partial<Festival> = {
                name: name.trim(),
                country: getVal("m-country") || countryVal,
                type: getVal("m-type"),
                status: getVal("m-status") as FestivalStatus,
                deadline: getVal("m-deadline") || deadlineVal,
                newsDate: getVal("m-news") || newsVal,
                category: getVal("m-cat"),
                nomination: getVal("m-nom"),
                platform: getVal("m-plat") || selectedPlat,
                price: getVal("m-price") || priceVal,
                link: rawLink,
                projectionDate: getVal("m-pdate"),
                projectionLocation: getVal("m-ploc"),
                projectionLat: projectionCoords?.lat,
                projectionLng: projectionCoords?.lng,
                laurel: laurelBase64 || undefined,
                laurelBg: laurelBgColor,
                observations: getVal("m-obs"),
                isPreliminary: isPreliminaryVal,
                distributionPlanId: distributionPlanIdVal || undefined,
                tasks: modalType === "edit" ? selectedFestival?.tasks : [],
              };

              if (modalType === "create" || modalType === "new_edition") {
                const initialHistoryEntry: StatusHistoryEntry = {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                  status: data.status || FestivalStatus.POR_ENVIAR,
                  timestamp: new Date().toISOString(),
                  updatedBy: userName,
                  note: modalType === "new_edition" 
                    ? `Apertura de Nueva Edición vinculada a edición previa ID: ${selectedFestival?.id}`
                    : "Registro inicial"
                };
                const newF: Festival = {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  ...(data as any),
                  statusHistory: [initialHistoryEntry],
                  createdBy: userName,
                  previousEditionId: modalType === "new_edition" ? selectedFestival?.id : undefined,
                  editionYear: new Date().getFullYear(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };

                if (modalType === "new_edition" && selectedFestival) {
                  // Actualizar también el historial del festival anterior
                  const updatedPrevious = festivals.map((f) => {
                    if (f.id === selectedFestival.id) {
                      const prevHistory = f.editionHistory || [];
                      return {
                        ...f,
                        editionHistory: [
                          ...prevHistory,
                          {
                            id: newF.id,
                            name: newF.name,
                            year: newF.editionYear,
                            status: newF.status,
                            createdAt: newF.createdAt
                          }
                        ]
                      };
                    }
                    return f;
                  });
                  setFestivals([newF, ...updatedPrevious]);
                  setSelectedFestival(newF);
                  addAuditLog(
                    "festivals",
                    `${userName} ha aperturado una nueva edición '${newF.name}' vinculada a '${selectedFestival.name}'.`
                  );
                } else {
                  setFestivals([newF, ...festivals]);
                  addAuditLog(
                    "festivals",
                    `${userName} ha registrado el festival '${data.name}'.`
                  );
                }
              } else {
                const changes: string[] = [];
                const labels: Record<string, string> = {
                  name: "Nombre",
                  country: "País",
                  type: "Tipo",
                  status: "Estado",
                  deadline: "Cierre",
                  newsDate: "Notificación",
                  category: "Categoría",
                  nomination: "Nominación",
                  platform: "Plataforma",
                  price: "Precio",
                  link: "Link",
                  projectionDate: "Fecha Proy.",
                  projectionLocation: "Lugar Proy.",
                  observations: "Observaciones",
                };

                Object.keys(data).forEach((key) => {
                  const k = key as keyof Partial<Festival>;
                  if (k === "tasks") return;
                  if (
                    selectedFestival &&
                    data[k] !== selectedFestival[k] &&
                    !(selectedFestival[k] === undefined && data[k] === "")
                  ) {
                    if (k === "laurel") {
                      changes.push("Laurel (Imagen) actualizada");
                    } else {
                      changes.push(
                        `${labels[k] || k}: "${selectedFestival[k] || "-"}" -> "${data[k] || "-"}"`
                      );
                    }
                  }
                });

                let updatedStatusHistory = selectedFestival?.statusHistory || [];
                if (selectedFestival && data.status !== selectedFestival.status) {
                  const statusNote = getVal("m-status-note") || "Modificado desde edición de festival";
                  const historyEntry: StatusHistoryEntry = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    status: data.status,
                    previousStatus: selectedFestival.status,
                    timestamp: new Date().toISOString(),
                    updatedBy: userName,
                    note: statusNote
                  };
                  updatedStatusHistory = [...updatedStatusHistory, historyEntry];
                }

                const finalData = {
                  ...data,
                  statusHistory: updatedStatusHistory
                };

                setFestivals(
                  festivals.map((f) =>
                    f.id === selectedFestival?.id ? { ...f, ...finalData } : f
                  )
                );
                setSelectedFestival({
                  ...selectedFestival,
                  ...finalData,
                } as Festival);

                let msg = `${userName} ha actualizado '${data.name || selectedFestival?.name}'.`;
                if (changes.length > 0) {
                  msg += ` Cambios: ${changes.join(", ")}`;
                }

                addAuditLog(
                  "festivals",
                  `Se ha actualizado la información de '${data.name || selectedFestival?.name}'. Cambios: ${changes.join(", ")}`
                );
              }
              onClose();
            }}
            disabled={isFormInvalid}
            className={cn(
              "w-full btn-primary py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2",
              isFormInvalid
                ? "opacity-50 cursor-not-allowed bg-slate-300 text-slate-500 shadow-none border-0 hover:bg-slate-300"
                : "shadow-[#e91e63]/20 hover:scale-[1.01]"
            )}
          >
            {modalType === "create"
              ? "Guardar Festival 💾"
              : modalType === "new_edition"
              ? "Abrir Nueva Edición 🚀"
              : "Actualizar Festival ✅"}
          </button>
          {isFormInvalid && (
            <p className="text-[11px] text-amber-700 text-center font-semibold mt-2.5 bg-amber-50/80 py-1.5 px-3 rounded-lg border border-amber-200">
              ⚠️ {missingMsg}
            </p>
          )}
        </div>
      </motion.div>

      {/* Modal de confirmación de Festival de Prueba (detector "test" en rol dev) */}
      {showTestConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-indigo-200 text-center space-y-4 relative">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
              <FlaskConical className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                ¿Crear Festival de Prueba?
              </h3>
              <p className="text-xs font-semibold text-slate-600 mt-2 leading-relaxed">
                Detectamos el nombre <span className="font-bold text-indigo-600">"test"</span> con rol de desarrollador. Se generará automáticamente un festival de prueba pre-configurado con checkboxes de testeo de sistema.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                disabled={testCountdown > 0}
                onClick={handleCreateTestFestival}
                className={cn(
                  "w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                  testCountdown > 0
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer"
                )}
              >
                {testCountdown > 0 ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin text-slate-400" />
                    Espere {testCountdown}s para habilitar...
                  </>
                ) : (
                  "Sí, crear festival de prueba 🧪"
                )}
              </button>
              <button
                onClick={() => setShowTestConfirmModal(false)}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
