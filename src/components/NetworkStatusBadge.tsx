import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Wifi, WifiOff, Cloud, CloudOff, Database, CheckCircle2, ArrowRight, RefreshCw, X } from 'lucide-react';

export const NetworkStatusBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isLocalMode, setIsLocalMode] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('__localMode') === 'true';
  });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleSyncModeChange = () => {
      setIsLocalMode(typeof window !== 'undefined' && localStorage.getItem('__localMode') === 'true');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('festis:sync-mode-change', handleSyncModeChange);
    window.addEventListener('cardigan:sync-mode-change', handleSyncModeChange);
    window.addEventListener('storage', handleSyncModeChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPopoverOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('festis:sync-mode-change', handleSyncModeChange);
      window.removeEventListener('cardigan:sync-mode-change', handleSyncModeChange);
      window.removeEventListener('storage', handleSyncModeChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const connectToCloud = () => {
    setIsConnecting(true);
    try {
      localStorage.removeItem('__localMode');
      window.dispatchEvent(new Event('festis:sync-mode-change'));
      window.dispatchEvent(new Event('cardigan:sync-mode-change'));
      setIsLocalMode(false);
      setTimeout(() => {
        setIsConnecting(false);
        setIsPopoverOpen(false);
      }, 500);
    } catch (e) {
      setIsConnecting(false);
    }
  };

  const switchToLocalMode = () => {
    try {
      localStorage.setItem('__localMode', 'true');
      window.dispatchEvent(new Event('cardigan:sync-mode-change'));
      setIsLocalMode(true);
      setIsPopoverOpen(false);
    } catch (e) {}
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        id="btn-network-data-badge"
        onClick={(e) => {
          e.stopPropagation();
          setIsPopoverOpen((prev) => !prev);
        }}
        className={`group relative z-30 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all border shadow-sm cursor-pointer select-none ${
          !isOnline
            ? 'bg-rose-500/10 text-rose-600 border-rose-400/30 hover:bg-rose-500/20'
            : isLocalMode
            ? 'bg-amber-500/15 text-amber-700 border-amber-500/40 hover:bg-amber-500/25 animate-pulse'
            : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20'
        }`}
        title="Origen de datos y conectividad. Clic para ver detalles."
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Sin Conexión</span>
          </>
        ) : isLocalMode ? (
          <>
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span>Modo Local</span>
          </>
        ) : (
          <>
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Nube</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </>
        )}
      </button>

      {isPopoverOpen && typeof document !== 'undefined' && createPortal(
        <div
          id="modal-network-status-backdrop"
          onClick={() => setIsPopoverOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            id="popover-network-sync-status"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm p-5 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-800 text-xs animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                {isLocalMode ? (
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                    <Database className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <Cloud className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {isLocalMode ? 'Modo Local (Caché)' : 'Nube (Firestore)'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isLocalMode ? 'Datos en memoria local' : 'Base de datos: festis-db-a'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-network-popover"
                onClick={() => setIsPopoverOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-4 text-slate-600 leading-relaxed text-[12px]">
              {isLocalMode ? (
                <p>
                  La aplicación está leyendo datos desde el almacenamiento local del navegador (o datos iniciales). Los cambios que realices no se están guardando en la nube.
                </p>
              ) : (
                <p>
                  Estás conectado en tiempo real a Firebase Firestore (base <span className="font-mono font-semibold text-emerald-700">festis-db-a</span>). Todos los festivales, ediciones y estados se sincronizan directamente con la base de datos central.
                </p>
              )}

              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 pt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <span>Conectividad de red: {isOnline ? 'Online (Conectado a Internet)' : 'Offline (Sin Internet)'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {isLocalMode ? (
                <button
                  type="button"
                  id="btn-switch-to-cloud"
                  disabled={isConnecting}
                  onClick={connectToCloud}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50 cursor-pointer text-xs"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Conectando a la Nube...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      <span>Conectar a la Nube (Firestore)</span>
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-switch-to-local"
                  onClick={switchToLocalMode}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition text-[11px] cursor-pointer"
                >
                  <CloudOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cambiar a Modo Local aislado</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
