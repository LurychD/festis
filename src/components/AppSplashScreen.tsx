import React, { useEffect, useState } from "react";
import { RefreshCw, WifiOff, AlertCircle, RotateCcw } from "lucide-react";

interface AppSplashScreenProps {
  initialMessage?: string;
  onForceContinue?: () => void;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({
  initialMessage = "Iniciando Festis...",
  onForceContinue,
}) => {
  const [status, setStatus] = useState(initialMessage);
  const [isSlow, setIsSlow] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // Fase 1: Transición suave de texto predeterminado
    const tPhase1 = setTimeout(() => {
      setStatus("Preparando entorno de trabajo...");
    }, 2800);

    // Fase 2: Detección de demora leve (6 segundos)
    const tSlow = setTimeout(() => {
      setIsSlow(true);
      setStatus("La conexión está demorando más de lo habitual. Comprobando sincronización...");
    }, 6000);

    // Fase 3: Detección de demora prolongada (12 segundos)
    const tTimeout = setTimeout(() => {
      setIsTimeout(true);
    }, 12000);

    return () => {
      clearTimeout(tPhase1);
      clearTimeout(tSlow);
      clearTimeout(tTimeout);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const handleLocalMode = () => {
    if (onForceContinue) {
      onForceContinue();
    } else {
      localStorage.setItem("__localMode", "true");
      window.location.reload();
    }
  };

  const handleClearCacheAndReset = () => {
    setIsResetting(true);
    try {
      // Limpiar datos transitorios de sesión conservando preferencias esenciales
      sessionStorage.clear();
      localStorage.removeItem("__localMode");
    } catch {
      // Manejo silencioso en caso de restricciones de iframe
    }
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <div
      id="app-splash-screen"
      className="fixed inset-0 w-full h-full flex flex-col items-center justify-center z-[999999] select-none p-4"
      style={{
        background: "linear-gradient(-45deg, #fce7f3, #e0e7ff, #e0f2fe, #fef3c7, #fce7f3)",
        backgroundSize: "400% 400%",
        animation: "splashGradientAnim 12s ease infinite",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div className="flex flex-col items-center text-center p-6 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-2xl max-w-sm w-full transition-all duration-300">
        {/* Identidad de la App */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/25 mb-3">
            <div className="w-5 h-5 rounded-full border-2 border-white/90 border-t-transparent animate-spin" />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">
            Festis
          </h1>
          <p className="text-[11px] font-medium text-slate-500 tracking-wide uppercase mt-0.5">
            Gestión y Distribución Audiovisual
          </p>
        </div>

        {/* Estado y progreso */}
        <div className="w-full flex flex-col items-center mb-4">
          <div className="text-xs font-semibold text-slate-700 leading-relaxed min-h-[36px] flex items-center justify-center text-center px-2">
            {status}
          </div>

          {/* Indicador de demora leve antes del panel completo */}
          {isSlow && !isTimeout && (
            <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[10px] font-bold text-amber-700 animate-pulse">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              <span>Verificando conectividad...</span>
            </div>
          )}
        </div>

        {/* Panel de contingencia en caso de demora prolongada (> 12s) */}
        {isTimeout && (
          <div
            id="splash-timeout-panel"
            className="w-full mt-2 pt-4 border-t border-slate-200/70 flex flex-col gap-2.5 text-left"
          >
            <div className="flex items-start gap-2 bg-rose-50/80 border border-rose-100 rounded-xl p-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight text-rose-900 font-medium">
                La respuesta está tardando más de lo habitual. Podés elegir una opción para continuar:
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full pt-1">
              <button
                type="button"
                id="splash-action-reload"
                onClick={handleReload}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-sm transition active:scale-[0.98]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reintentar conexión</span>
              </button>

              <button
                type="button"
                id="splash-action-local"
                onClick={handleLocalMode}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm transition active:scale-[0.98]"
              >
                <WifiOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Continuar en modo local</span>
              </button>

              <button
                type="button"
                id="splash-action-reset"
                onClick={handleClearCacheAndReset}
                disabled={isResetting}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isResetting ? "Restableciendo..." : "Restablecer sesión local"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

