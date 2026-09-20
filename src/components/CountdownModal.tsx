import React, { useState, useEffect } from "react";
import { X, Clock, Calendar, Sparkles } from "lucide-react";
import { differenceInSeconds, parseISO } from "date-fns";

interface CountdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
  planName: string;
}

export const CountdownModal: React.FC<CountdownModalProps> = ({
  isOpen,
  onClose,
  targetDate,
  planName,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOver: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: false });

  useEffect(() => {
    if (!isOpen || !targetDate) return;

    const calculateTime = () => {
      try {
        const target = parseISO(targetDate);
        const now = new Date();
        const diff = differenceInSeconds(target, now);

        if (diff <= 0) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
          return;
        }

        const days = Math.floor(diff / (3600 * 24));
        const hours = Math.floor((diff % (3600 * 24)) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        setTimeLeft({ days, hours, minutes, seconds, isOver: false });
      } catch (err) {
        console.error("Error calculating countdown:", err);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [isOpen, targetDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider truncate">
                Plazo de Resolución
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                {planName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Countdown Grid */}
        {timeLeft.isOver ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-150 space-y-2">
            <div className="flex justify-center text-indigo-500 mb-1">
              <Sparkles className="h-8 w-8 animate-pulse" />
            </div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              ¡Plazo Cumplido!
            </h4>
            <p className="text-[11px] text-slate-500 font-medium max-w-xs mx-auto">
              La fecha de resolución prevista para este plan de distribución ya ha sido alcanzada.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Días", value: timeLeft.days },
                { label: "Horas", value: timeLeft.hours },
                { label: "Min.", value: timeLeft.minutes },
                { label: "Seg.", value: timeLeft.seconds },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm"
                >
                  <span className="text-2xl font-black text-indigo-600 font-mono tracking-tight">
                    {String(item.value).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 justify-center text-xs text-slate-500 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/40">
              <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>
                Fecha Límite: <strong className="text-slate-700">{new Date(targetDate).toLocaleDateString("es-AR", { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-md"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
