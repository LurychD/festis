import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Key,
  X,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  Monitor,
  Layers,
} from "lucide-react";

export interface KeyDuplicateItem {
  id: string;
  keyName: string;
  screen: string;
  componentStack?: string;
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
}

interface KeyDuplicatesInspectorProps {
  showToast?: (msg: string) => void;
}

const VIEW_NAME_MAP: Record<string, string> = {
  dashboard: "Inicio (Dashboard)",
  list: "Lista de Festivales",
  festivals: "Lista de Festivales",
  details: "Detalles de Festival",
  calendar: "Calendario de Festivales",
  tasks: "Gestor de Tareas",
  stats: "Estadísticas",
  planning: "Planificación Estratégica",
  config: "Configuración y Ajustes",
  help: "Ayuda y Tutoriales",
  film_data: "Ficha Técnica de Película",
  bugs: "Gestor de Bugs y Roadmap",
  production_notes: "Notas de Producción / Bitácora",
  play_zone: "Play Zone",
  easteregg: "Laboratorio Secreto",
  social_media: "Módulo Social",
  reports: "Informes y Reportes",
  archive: "Archivo Histórico",
  gallery: "Galería Multimedia",
  notes: "Notas Rápidas",
};

export const KeyDuplicatesInspector: React.FC<KeyDuplicatesInspectorProps> = ({
  showToast,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [keyDuplicates, setKeyDuplicates] = useState<KeyDuplicateItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Keep original console references
  const originalErrorRef = useRef<typeof console.error | null>(null);
  const originalWarnRef = useRef<typeof console.warn | null>(null);

  // Helper to get current friendly screen name + active modal
  const getCurrentScreenContext = (): string => {
    const rawView = (window as any).__currentView || "dashboard";
    let screenName = VIEW_NAME_MAP[rawView] || rawView;

    // Detect active modal or dialog in DOM
    const modalHeading = document.querySelector(
      "div[role='dialog'] h2, div[role='dialog'] h3, .glass-card h3, .modal-title, [class*='modal'] h3, [class*='Modal'] h3"
    );
    if (modalHeading && modalHeading.textContent) {
      const modalText = modalHeading.textContent.trim();
      if (modalText.length > 0 && modalText.length < 60) {
        screenName += ` (Modal: "${modalText}")`;
      }
    }

    return screenName;
  };

  // Extract component name from Fiber node
  const getFiberComponentName = (fiber: any): string => {
    if (!fiber) return "Unknown";
    const type = fiber.type;
    if (!type) return "Element";
    if (typeof type === "string") return type;
    if (typeof type === "function") return type.displayName || type.name || "Component";
    if (typeof type === "object") {
      if (type.displayName) return type.displayName;
      if (type.name) return type.name;
      if (type.render) return type.render.displayName || type.render.name || "ForwardRef";
    }
    return "Component";
  };

  // Clean and parse component stack trace from console arguments
  const extractComponentStack = (args: any[]): string => {
    for (const arg of args) {
      if (typeof arg === "string" && (arg.includes("in ") || arg.includes("\nin "))) {
        const lines = arg
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => /^in\s+/i.test(l))
          .map((l) => l.replace(/^in\s+/i, ""))
          .slice(0, 4);

        if (lines.length > 0) {
          return lines.join(" > ");
        }
      }
    }
    return "";
  };

  useEffect(() => {
    originalErrorRef.current = console.error;
    originalWarnRef.current = console.warn;

    const handleLog = (type: "error" | "warn", args: any[]) => {
      const rawText = args
        .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
        .join(" ");

      const isReactKeyWarning =
        rawText.includes("Encountered two children with the same key") ||
        rawText.includes("same key") ||
        rawText.includes('unique "key" prop') ||
        rawText.includes("unique 'key' prop");

      if (isReactKeyWarning) {
        // 1. Format sprintf style messages properly (%s -> arg value)
        let formattedMessage = "";
        if (typeof args[0] === "string" && args[0].includes("%s")) {
          let argIdx = 1;
          formattedMessage = args[0].replace(/%s/g, () => {
            const val = args[argIdx++];
            if (val === undefined || val === null) return "";
            return typeof val === "object" ? JSON.stringify(val) : String(val);
          });
          for (; argIdx < args.length; argIdx++) {
            const val = args[argIdx];
            if (val) {
              formattedMessage +=
                "\n" +
                (typeof val === "object" ? JSON.stringify(val, null, 2) : String(val));
            }
          }
        } else {
          formattedMessage = rawText;
        }

        // 2. Extract key value directly from args[1] if present, or parse from message
        let extractedKey = "";
        if (args[1] !== undefined && args[1] !== null && typeof args[1] !== "object") {
          extractedKey = String(args[1]);
        } else {
          const match =
            formattedMessage.match(/key, `([^`]*)\`/) ||
            formattedMessage.match(/key `([^`]*)`/) ||
            formattedMessage.match(/key '([^']*)'/);
          if (match) {
            extractedKey = match[1];
          }
        }

        // 3. Extract component stack trace
        const componentStack = extractComponentStack(args);
        const currentScreen = getCurrentScreenContext();
        const now = new Date().toLocaleTimeString();

        const displayKeyName = extractedKey === "" ? `"" (key vacía)` : extractedKey;

        setKeyDuplicates((prev) => {
          const existingIdx = prev.findIndex(
            (item) => item.keyName === displayKeyName && item.screen === currentScreen
          );

          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              count: updated[existingIdx].count + 1,
              lastSeen: now,
              message: formattedMessage,
              componentStack: componentStack || updated[existingIdx].componentStack,
            };
            return updated;
          } else {
            return [
              {
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                keyName: displayKeyName,
                screen: currentScreen,
                componentStack: componentStack || "Detectado por advertencia de React",
                message: formattedMessage,
                count: 1,
                firstSeen: now,
                lastSeen: now,
              },
              ...prev,
            ];
          }
        });
      }

      // Call original console method
      if (type === "error" && originalErrorRef.current) {
        originalErrorRef.current.apply(console, args);
      } else if (type === "warn" && originalWarnRef.current) {
        originalWarnRef.current.apply(console, args);
      }
    };

    console.error = (...args: any[]) => handleLog("error", args);
    console.warn = (...args: any[]) => handleLog("warn", args);

    return () => {
      if (originalErrorRef.current) console.error = originalErrorRef.current;
      if (originalWarnRef.current) console.warn = originalWarnRef.current;
    };
  }, []);

  // Deep DOM & React Fiber Tree Scanner
  const scanDOMForDuplicateKeys = () => {
    const currentScreen = getCurrentScreenContext();
    const now = new Date().toLocaleTimeString();

    let reactDuplicatesFound = 0;
    let htmlDuplicatesFound = 0;

    // 1. Locate root Fiber node
    const rootEl = document.getElementById("root") || document.body;
    let rootFiber: any = null;

    const containerKey = Object.keys(rootEl).find(
      (k) => k.startsWith("__reactContainer$") || k.startsWith("__reactCell$")
    );
    if (containerKey) {
      rootFiber = (rootEl as any)[containerKey];
      if (rootFiber && rootFiber.current) {
        rootFiber = rootFiber.current;
      }
    }

    if (!rootFiber) {
      // Find any element with __reactFiber$
      const sampleEl = document.querySelector("*");
      if (sampleEl) {
        const fiberKey = Object.keys(sampleEl).find((k) =>
          k.startsWith("__reactFiber$")
        );
        if (fiberKey) {
          let curr = (sampleEl as any)[fiberKey];
          while (curr && curr.return) {
            curr = curr.return;
          }
          rootFiber = curr;
        }
      }
    }

    // Helper to traverse Fiber tree
    if (rootFiber) {
      const traverseFiber = (fiber: any) => {
        if (!fiber) return;

        // Check children of this fiber node (fiber.child and its siblings)
        if (fiber.child) {
          const siblings: any[] = [];
          let child = fiber.child;
          while (child) {
            siblings.push(child);
            child = child.sibling;
          }

          if (siblings.length > 1) {
            const keyMap = new Map<string, any[]>();
            siblings.forEach((s) => {
              if (s.key !== null && s.key !== undefined) {
                const kStr = String(s.key);
                if (!keyMap.has(kStr)) keyMap.set(kStr, []);
                keyMap.get(kStr)!.push(s);
              }
            });

            keyMap.forEach((matchedFibers, kStr) => {
              if (matchedFibers.length > 1) {
                reactDuplicatesFound++;
                const parentComp = getFiberComponentName(fiber);
                const childComps = Array.from(
                  new Set(matchedFibers.map(getFiberComponentName))
                ).join(", ");

                const displayKey = kStr === "" ? `"" (key vacía)` : kStr;
                const stackInfo = `${parentComp} > [${childComps}]`;
                const msg = `[Escaneo de React Fiber] Se encontraron ${matchedFibers.length} elementos hermanos con la key ${displayKey} bajo el componente parental <${parentComp}> en ${currentScreen}.`;

                setKeyDuplicates((prev) => {
                  const existingIdx = prev.findIndex(
                    (item) => item.keyName === displayKey && item.screen === currentScreen
                  );
                  if (existingIdx >= 0) {
                    const updated = [...prev];
                    updated[existingIdx] = {
                      ...updated[existingIdx],
                      count: Math.max(updated[existingIdx].count, matchedFibers.length),
                      lastSeen: now,
                      message: msg,
                      componentStack: stackInfo,
                    };
                    return updated;
                  } else {
                    return [
                      {
                        id: `fiber-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                        keyName: displayKey,
                        screen: currentScreen,
                        componentStack: stackInfo,
                        message: msg,
                        count: matchedFibers.length,
                        firstSeen: now,
                        lastSeen: now,
                      },
                      ...prev,
                    ];
                  }
                });
              }
            });
          }
        }

        // Recurse into child
        let currentChild = fiber.child;
        while (currentChild) {
          traverseFiber(currentChild);
          currentChild = currentChild.sibling;
        }
      };

      traverseFiber(rootFiber);
    }

    // 2. Scan standard HTML DOM attributes (id and data-key)
    const domAttrMap = new Map<string, { count: number; tagNames: Set<string> }>();
    const allElements = Array.from(document.querySelectorAll("*"));

    allElements.forEach((el) => {
      const domId = el.getAttribute("id");
      const dataKey = el.getAttribute("data-key");
      [domId, dataKey].forEach((attr) => {
        if (
          attr &&
          attr.trim() !== "" &&
          !attr.startsWith("root") &&
          !attr.startsWith("app") &&
          !attr.startsWith("react-")
        ) {
          const existing = domAttrMap.get(attr) || { count: 0, tagNames: new Set() };
          existing.count += 1;
          existing.tagNames.add(el.tagName.toLowerCase());
          domAttrMap.set(attr, existing);
        }
      });
    });

    domAttrMap.forEach(({ count, tagNames }, attrVal) => {
      if (count > 1) {
        htmlDuplicatesFound++;
        const tagsStr = Array.from(tagNames).join(", ");
        const msg = `[Escaneo HTML DOM] Se encontraron ${count} elementos con id/data-key="${attrVal}" (<${tagsStr}>) en ${currentScreen}.`;

        setKeyDuplicates((prev) => {
          const existingIdx = prev.findIndex(
            (item) => item.keyName === attrVal && item.screen === currentScreen
          );
          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              count: Math.max(updated[existingIdx].count, count),
              lastSeen: now,
              message: msg,
            };
            return updated;
          } else {
            return [
              {
                id: `dom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                keyName: attrVal,
                screen: currentScreen,
                componentStack: `<${tagsStr}>`,
                message: msg,
                count,
                firstSeen: now,
                lastSeen: now,
              },
              ...prev,
            ];
          }
        });
      }
    });

    const totalFoundInScan = reactDuplicatesFound + htmlDuplicatesFound;

    if (showToast) {
      if (totalFoundInScan > 0) {
        showToast(
          `⚠️ Escaneo completado: ${totalFoundInScan} duplicado(s) detectado(s) en ${currentScreen}.`
        );
      } else {
        showToast(
          `✅ Escaneo de React completado: No se encontraron keys duplicadas en la vista actual (${currentScreen}).`
        );
      }
    }
  };

  const totalDuplicatesCount = keyDuplicates.reduce((acc, item) => acc + item.count, 0);

  const filteredItems = keyDuplicates.filter(
    (item) =>
      item.keyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.screen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.componentStack &&
        item.componentStack.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCopyReport = () => {
    if (keyDuplicates.length === 0) return;
    const reportText =
      `--- REPORTE DE KEYS DUPLICADAS EN REACT ---\n` +
      `Fecha y Hora: ${new Date().toLocaleString()}\n` +
      `Total de Keys afectadas: ${keyDuplicates.length}\n` +
      `Total de Ocurrencias/Errores: ${totalDuplicatesCount}\n\n` +
      keyDuplicates
        .map(
          (item, i) =>
            `${i + 1}. Key: ${item.keyName}\n` +
            `   📍 Pantalla/Vista: ${item.screen}\n` +
            `   🧩 Componente/Stack: ${item.componentStack || "No especificado"}\n` +
            `   🔢 Ocurrencias: ${item.count} | Primera: ${item.firstSeen} | Última: ${item.lastSeen}\n` +
            `   📝 Detalle: ${item.message.replace(/\n/g, " ")}`
        )
        .join("\n\n----------------------------------------\n\n");

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    if (showToast) showToast("Reporte de keys copiado al portapapeles ✅");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-20 right-6 z-[250] flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        {/* Floating Toggle Button */}
        {!isOpen && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => setIsOpen(true)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 ${
              keyDuplicates.length > 0
                ? "bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/30 animate-pulse"
                : "bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700"
            }`}
          >
            <Key className="h-4 w-4" />
            <span>Inspector Keys</span>
            {keyDuplicates.length > 0 && (
              <span className="bg-white text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full shadow-inner">
                {keyDuplicates.length}
              </span>
            )}
          </motion.button>
        )}

        {/* Panel Container */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-80 sm:w-[440px] bg-slate-900/95 backdrop-blur-xl border border-slate-800 text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-3.5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      keyDuplicates.length > 0
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    <Key className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-100 truncate">
                      Detector de Keys Duplicadas
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {keyDuplicates.length === 0
                        ? "Monitoreo activo • Sin duplicados"
                        : `${keyDuplicates.length} keys afectadas (${totalDuplicatesCount} ocurrencias)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title={isMinimized ? "Maximizar" : "Minimizar"}
                  >
                    {isMinimized ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-400 transition-colors"
                    title="Cerrar Inspector"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              {!isMinimized && (
                <>
                  {/* Action Bar */}
                  <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar por key, vista o componente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-8 pr-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      onClick={scanDOMForDuplicateKeys}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/40 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0 shadow-sm"
                      title="Escanear en profundidad el árbol Fiber de la pantalla visible"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Escanear
                    </button>

                    <button
                      onClick={() => setKeyDuplicates([])}
                      disabled={keyDuplicates.length === 0}
                      className="p-1.5 bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl transition-colors disabled:opacity-40 shrink-0"
                      title="Limpiar lista"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Duplicate Keys List */}
                  <div className="p-3 overflow-y-auto space-y-3 flex-1 max-h-[380px] min-h-[160px]">
                    {filteredItems.length === 0 ? (
                      <div className="p-6 text-center space-y-2 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                        <Key className="h-8 w-8 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400 font-medium">
                          {keyDuplicates.length === 0
                            ? "No se han detectado keys duplicadas hasta el momento."
                            : "Ningún resultado coincide con la búsqueda."}
                        </p>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Haz clic en <strong>Escanear</strong> o navega entre secciones para realizar la detección automática.
                        </p>
                      </div>
                    ) : (
                      filteredItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-800/70 border border-rose-500/30 hover:border-rose-500/50 rounded-xl p-3 space-y-2 transition-colors shadow-sm"
                        >
                          {/* Top row: Key + Count */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-mono font-black px-2.5 py-0.5 rounded-md truncate max-w-[250px]">
                              key={item.keyName}
                            </span>

                            <span className="bg-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shrink-0 shadow-sm">
                              {item.count} {item.count === 1 ? "ocurrencia" : "ocurrencias"}
                            </span>
                          </div>

                          {/* Location context info */}
                          <div className="grid grid-cols-1 gap-1 text-[10px] bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-1.5 text-indigo-300 font-medium truncate">
                              <Monitor className="h-3 w-3 shrink-0 text-indigo-400" />
                              <span className="font-bold">Vista:</span>
                              <span className="truncate">{item.screen}</span>
                            </div>

                            {item.componentStack && (
                              <div className="flex items-start gap-1.5 text-amber-300/90 font-medium leading-tight">
                                <Layers className="h-3 w-3 shrink-0 text-amber-400 mt-0.5" />
                                <span className="font-bold shrink-0">Stack:</span>
                                <span className="font-mono text-[10px] text-amber-200 break-words">
                                  {item.componentStack}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Full React message */}
                          <p className="text-[10px] text-slate-300 font-mono leading-relaxed bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 break-words max-h-28 overflow-y-auto">
                            {item.message}
                          </p>

                          {/* Timestamps */}
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium pt-0.5">
                            <span>Primera: {item.firstSeen}</span>
                            <span>Última: {item.lastSeen}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 bg-slate-800/60 border-t border-slate-700/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Info className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>Inspección React activa</span>
                    </div>

                    <button
                      onClick={handleCopyReport}
                      disabled={keyDuplicates.length === 0}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-40 shadow-sm"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-300" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copiar Reporte
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
