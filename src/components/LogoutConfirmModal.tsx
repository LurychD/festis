/**
 * Modal de confirmación de cierre de sesión con temporizador regresivo de seguridad.
 * Previene salidas accidentales mediante un retardo controlado de 5 segundos.
 */

import React, { useState, useEffect } from 'react';
import { LogOut, X, AlertTriangle, ShieldCheck } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userEmail?: string;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(5);
      return;
    }

    setSecondsRemaining(5);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center">
        {/* Ícono de advertencia de seguridad */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5 border border-rose-100">
          <LogOut className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          ¿Cerrar sesión en Festis?
        </h3>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Vas a salir de la cuenta {userEmail ? <span className="font-semibold text-slate-800">({userEmail})</span> : ''}. 
          Para evitar cierres involuntarios, el botón se habilitará en{' '}
          {secondsRemaining > 0 ? (
            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">
              {secondsRemaining}s
            </span>
          ) : (
            <span className="font-semibold text-emerald-600">ahora</span>
          )}
          .
        </p>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 active:scale-95 transition-all"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={secondsRemaining > 0}
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              secondsRemaining > 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 active:scale-95'
            }`}
          >
            {secondsRemaining > 0 ? `Espera (${secondsRemaining})` : 'Cerrar Sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};
