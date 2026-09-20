import React, { useEffect, useState } from 'react';
import { Database, UploadCloud } from 'lucide-react';
import { getFirestoreReads, getFirestoreWrites, getFirestoreDeletes } from '../utils/readCounters';

export const FirestoreDebugger: React.FC<{ showAlert: (msg: string, details?: string) => void, isDev?: boolean }> = ({ showAlert, isDev }) => {
  const [reads, setReads] = useState(getFirestoreReads());
  const [writes, setWrites] = useState(getFirestoreWrites());
  const [deletes, setDeletes] = useState(getFirestoreDeletes());
  const [isVisible, setIsVisible] = useState(false); // Can be minimized

  useEffect(() => {
    const handleReadSync = (e: any) => {
      const payload = e.detail;
      setReads(payload?.total ?? payload);
      if (payload?.delta && payload.delta > 0) {
        showAlert(`Lectura de BD: ${payload.delta} docs`);
      }
    };

    const handleWriteSync = (e: any) => {
      const payload = e.detail;
      setWrites(payload?.total ?? payload);
      if (payload?.delta && payload.delta > 0) {
        showAlert(`Escritura en BD: +${payload.delta} operaciones guardadas`);
      }
    };

    const handleDeleteSync = (e: any) => {
      const payload = e.detail;
      setDeletes(payload?.total ?? payload);
      if (payload?.delta && payload.delta > 0) {
        showAlert(`Eliminación en BD: -${payload.delta} operaciones eliminadas`);
      }
    };

    window.addEventListener('firestoreReadSync', handleReadSync);
    window.addEventListener('firestoreWriteSync', handleWriteSync);
    window.addEventListener('firestoreDeleteSync', handleDeleteSync);

    return () => {
      window.removeEventListener('firestoreReadSync', handleReadSync);
      window.removeEventListener('firestoreWriteSync', handleWriteSync);
      window.removeEventListener('firestoreDeleteSync', handleDeleteSync);
    };
  }, [showAlert]);

  const isLocalMode = localStorage.getItem('__localMode') === 'true';

  if (!isLocalMode && !isDev) return null; // Show only if dev mode or local testing

  return (
    <div className={`fixed bottom-20 left-4 z-50 flex flex-col gap-2 transition-all`}>
      <button 
        onClick={() => setIsVisible(!isVisible)}
        className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg hover:bg-slate-700 active:scale-95 border border-white/10"
        title="Debug Firebase"
      >
        <Database className="h-4 w-4 text-emerald-400" />
      </button>
      
      {isVisible && (
        <div className="bg-slate-900/90 backdrop-blur border border-white/10 rounded-xl p-3 text-white shadow-2xl max-w-[200px] animate-in slide-in-from-bottom-4">
          <div className="mb-2 pb-2 border-b border-white/10 flex items-center gap-2">
            <Database className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Firebase Stats Locales</span>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-300">Lecturas</span>
              <div className="bg-slate-800 px-2 py-0.5 rounded text-xs font-mono text-blue-300">{reads}</div>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-300">Escrituras</span>
              <div className="bg-slate-800 px-2 py-0.5 rounded text-xs font-mono text-emerald-300">{writes}</div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-300">Eliminaciones</span>
              <div className="bg-slate-800 px-2 py-0.5 rounded text-xs font-mono text-rose-300">{deletes}</div>
            </div>
          </div>
          
          <p className="text-[9px] text-slate-500 mt-3 pt-2 border-t border-white/10 leading-tight">
            Contador de operaciones de tu sesión local. En la consola web de Firebase verás los totales globales de todos los usuarios.
          </p>
        </div>
      )}
    </div>
  );
};
