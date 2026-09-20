import React from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  format,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight, Plus, CheckSquare, Clock, Edit2, Trash2 } from "lucide-react";
import { cn, parseFestivalDate } from "../utils/helpers";
import { Festival, Reminder, SocialPost, AppMember } from "../types";

interface CalendarViewProps {
  activeFestivals: Festival[];
  festivals: Festival[];
  reminders: Reminder[];
  socialPosts: SocialPost[];
  members: AppMember[];
  currentMonthDate: Date;
  setCurrentMonthDate: (d: Date) => void;
  selectedCalendarDate: Date | null;
  setSelectedCalendarDate: (d: Date | null) => void;
  setView: (v: any) => void;
  setSelectedFestival: (f: Festival) => void;
  setEditingReminder: (r: Reminder | null) => void;
  setIsReminderModalOpen: (b: boolean) => void;
  deleteReminder: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  activeFestivals,
  festivals,
  reminders,
  socialPosts,
  members,
  currentMonthDate,
  setCurrentMonthDate,
  selectedCalendarDate,
  setSelectedCalendarDate,
  setView,
  setSelectedFestival,
  setEditingReminder,
  setIsReminderModalOpen,
  deleteReminder,
}) => {
  // Determine the array of days to display for currentMonthDate
  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });

  // We can add empty spaces for the first day of the month offset
  const firstDayOffset = monthStart.getDay(); // 0 is Sunday, 1 is Monday...

  const events: any[] = activeFestivals.flatMap((f) => {
    const festivalEvents = [];
    if (f.deadline) {
      const d = parseFestivalDate(f.deadline);
      if (d && !isNaN(d.getTime())) {
        festivalEvents.push({
          id: `${f.id}-cierre`,
          date: d,
          name: f.name,
          type: "Cierre",
          festival: f,
        });
      }
    }
    if (f.projectionDate) {
      const d = parseFestivalDate(f.projectionDate);
      if (d && !isNaN(d.getTime())) {
        festivalEvents.push({
          id: `${f.id}-proy`,
          date: d,
          name: f.name,
          type: "Proyección",
          festival: f,
        });
      }
    }
    if (f.newsDate) {
      const d = parseFestivalDate(f.newsDate);
      if (d && !isNaN(d.getTime())) {
        festivalEvents.push({
          id: `${f.id}-news`,
          date: d,
          name: f.name,
          type: "Notificación",
          festival: f,
        });
      }
    }
    if (f.tasks) {
      f.tasks.forEach((t) => {
        if (t.dueDate && !t.completed) {
          const d = parseFestivalDate(t.dueDate);
          if (d && !isNaN(d.getTime())) {
            festivalEvents.push({
              id: `${f.id}-task-${t.id}`,
              date: d,
              name: `Tarea: ${t.title} (${f.name})`,
              type: "Tarea",
              festival: f,
            });
          }
        }
      });
    }
    return festivalEvents;
  });

  reminders.forEach((r, i) => {
    const d = parseFestivalDate(r.date);
    if (d && !isNaN(d.getTime())) {
      events.push({
        id: `reminder-${r.id}`,
        date: d,
        name: r.time ? `${r.time} - ${r.title}` : r.title,
        type: "Recordatorio",
        reminder: r,
        festival: r.festivalId ? festivals.find((f) => f.id === r.festivalId) : undefined,
      });
    }
  });

  socialPosts.forEach((p) => {
    if (p.scheduledDate) {
      const d = parseISO(p.scheduledDate);
      if (d && !isNaN(d.getTime())) {
        events.push({
          id: `social-${p.id}`,
          date: d,
          name: `@ ${p.content || p.type}`,
          type: "Redes Sociales",
          post: p,
        });
      }
    }
  });

  members.forEach((m) => {
    if (m.birthday) {
      const parts = m.birthday.split("-");
      if (parts.length >= 3) {
        const mMonth = parseInt(parts[1], 10) - 1;
        const mDay = parseInt(parts[2], 10);
        const d = new Date(currentMonthDate.getFullYear(), mMonth, mDay);
        events.push({
          id: `cumple-${m.id}`,
          date: d,
          name: `Cumpleaños de ${m.name || m.email}`,
          type: "Cumpleaños",
        });
      }
    }
  });

  const selectedEvents = selectedCalendarDate
    ? events.filter((e) => isSameDay(e.date!, selectedCalendarDate))
    : [];

  return (
    <div className="space-y-8 pb-32 max-w-xl mx-auto">
      <header className="flex flex-col gap-1 items-center">
        <h2 className="text-4xl font-black tracking-tight uppercase text-center">
          Calendario
        </h2>
        <div className="flex items-center gap-4 mt-2 justify-center">
          <button
            id="btn-auto-18"
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
            onClick={() => {
              const prev = new Date(currentMonthDate);
              prev.setMonth(prev.getMonth() - 1);
              setCurrentMonthDate(prev);
            }}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <p className="text-slate-600 text-sm font-bold tracking-[0.3em] uppercase w-40 text-center">
            {format(currentMonthDate, "MMMM yyyy", { locale: es })}
          </p>
          <button
            id="btn-auto-19"
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
            onClick={() => {
              const next = new Date(currentMonthDate);
              next.setMonth(next.getMonth() + 1);
              setCurrentMonthDate(next);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => {
            setEditingReminder(null);
            setIsReminderModalOpen(true);
          }}
          className="mt-4 px-6 py-2 w-full max-w-xs bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 rounded-2xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" /> Añadir Recordatorio
        </button>
      </header>

      <div className="glass-card p-2 sm:p-4 border-slate-100 max-w-3xl mx-auto">
        <div className="grid grid-cols-7 gap-y-1 sm:gap-y-2 text-center mb-2 sm:mb-4">
          {["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"].map((d, idx) => (
            <span
              key={`${d}-${idx}`}
              className="text-[9px] sm:text-[10px] font-black text-slate-400 sm:text-slate-300 tracking-widest truncate"
            >
              {d}
            </span>
          ))}
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {daysInMonth.map((day, idx) => {
            const dayEvents = events.filter((e) => isSameDay(e.date!, day));
            const isToday = isSameDay(day, new Date());
            const isSelected =
              selectedCalendarDate && isSameDay(day, selectedCalendarDate);

            return (
              <div
                key={`${day.toISOString()}-${idx}`}
                onClick={() => setSelectedCalendarDate(day)}
                className="flex flex-col items-center justify-center relative py-1 cursor-pointer group"
              >
                <div
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-xl sm:rounded-xl text-xs sm:text-sm font-bold transition-all relative z-10",
                    isToday ? "border-2 border-amber-500 text-amber-600" : "",
                    isSelected
                      ? "bg-[#e91e63] text-white shadow-lg shadow-[#e91e63]/30 scale-110"
                      : "text-slate-600 group-hover:bg-slate-50",
                  )}
                >
                  {format(day, "d")}
                </div>
                {dayEvents.length > 0 && !isSelected && (
                  <div className="absolute bottom-1 flex gap-1">
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <div
                        key={`day-ev-${e.id || 'e'}-${idx}`}
                        className={cn(
                          "h-1 w-1 rounded-full",
                          e.type === "Proyección"
                            ? "bg-blue-400"
                            : e.type === "Notificación"
                              ? "bg-emerald-400"
                              : e.type === "Cumpleaños"
                                ? "bg-purple-500 shadow-[0_0_5px_#a855f7]"
                                : e.type === "Tarea"
                                  ? "bg-fuchsia-500"
                                  : e.type === "Recordatorio"
                                    ? "bg-cyan-500"
                                    : e.type === "Redes Sociales"
                                      ? "bg-sky-500 shadow-[0_0_5px_#0ea5e9]"
                                      : "bg-[#e91e63]",
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">
            Agenda del día:{" "}
            {selectedCalendarDate
              ? format(selectedCalendarDate, "dd/MM")
              : "Selecciona un día"}
          </h3>
        </div>

        <div className="space-y-3">
          {selectedEvents.length > 0 ? (
            selectedEvents.map((e, idx) => (
              <div
                key={`selected-ev-${e.id || 'e'}-${idx}`}
                onClick={() => {
                  if (e.type === "Redes Sociales") {
                    setView("social_media");
                  } else if (e.festival) {
                    setSelectedFestival(e.festival);
                    setView("details");
                  } else if (e.type === "Cumpleaños") {
                    import("canvas-confetti").then(({ default: confetti }) => {
                      confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 },
                        colors: ["#e91e63", "#a855f7", "#fbbf24"],
                      });
                    });
                  }
                }}
                className={cn(
                  "glass-card flex items-center gap-5 group transition-all border-l-4",
                  e.festival || e.type === "Cumpleaños"
                    ? "cursor-pointer hover:bg-white/80"
                    : "cursor-default",
                  e.type === "Proyección"
                    ? "border-l-blue-500"
                    : e.type === "Notificación"
                      ? "border-l-emerald-500"
                      : e.type === "Cumpleaños"
                        ? "border-l-purple-500"
                        : e.type === "Tarea"
                          ? "border-l-fuchsia-500"
                          : e.type === "Recordatorio"
                            ? "border-l-cyan-500"
                            : e.type === "Redes Sociales"
                              ? "border-l-sky-500"
                              : "border-l-[#e91e63]",
                )}
              >
                <div
                  className={cn(
                    "flex flex-col items-center justify-center bg-slate-50 rounded-2xl shrink-0",
                    e.type === "Tarea" || e.type === "Recordatorio"
                      ? "bg-transparent border-0 h-10 w-10"
                      : "h-14 w-14 border border-slate-100",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] items-center justify-center font-black uppercase flex",
                      e.type === "Proyección"
                        ? "text-blue-500"
                        : e.type === "Notificación"
                          ? "text-emerald-500"
                          : e.type === "Cumpleaños"
                            ? "text-purple-500 text-lg"
                            : e.type === "Tarea"
                              ? "text-fuchsia-500"
                              : e.type === "Recordatorio"
                                ? "text-cyan-500"
                                : e.type === "Redes Sociales"
                                  ? "text-sky-500"
                                  : "text-[#e91e63]",
                    )}
                  >
                    {e.type === "Proyección" ? (
                      "🎥"
                    ) : e.type === "Notificación" ? (
                      "🔔"
                    ) : e.type === "Cumpleaños" ? (
                      "🎂"
                    ) : e.type === "Tarea" ? (
                      <CheckSquare className="w-10 h-10 stroke-[1.5]" />
                    ) : e.type === "Recordatorio" ? (
                      <Clock className="w-10 h-10 stroke-[2]" />
                    ) : e.type === "Redes Sociales" ? (
                      "@"
                    ) : (
                      "⏰"
                    )}
                  </span>
                  {e.type !== "Cumpleaños" &&
                    e.type !== "Tarea" &&
                    e.type !== "Recordatorio" && (
                      <span className="text-xl font-black text-slate-800">
                        {format(e.date!, "d")}
                      </span>
                    )}
                </div>
                <div>
                  <p
                    className={cn(
                      "font-bold text-sm text-slate-800 tracking-tight max-w-[250px] leading-tight break-words",
                      e.type === "Tarea" ||
                        e.type === "Recordatorio" ||
                        e.type === "Redes Sociales"
                        ? "normal-case"
                        : "uppercase",
                    )}
                  >
                    {e.name}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] font-black tracking-widest text-slate-400",
                      e.type === "Tarea" || e.type === "Recordatorio"
                        ? "capitalize"
                        : "uppercase",
                    )}
                  >
                    {e.type}
                    {e.type === "Proyección" &&
                      e.festival?.projectionDate?.includes("T") &&
                      ` a las ${format(e.date!, "HH:mm")}hs`}
                    {e.festival &&
                      e.type !== "Tarea" &&
                      ` • ${e.festival.country}`}
                  </p>
                </div>
                {e.type === "Recordatorio" && e.reminder && (
                  <div className="ml-auto flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setEditingReminder(e.reminder);
                        setIsReminderModalOpen(true);
                      }}
                      className="p-2 bg-slate-100 hover:bg-cyan-100 text-cyan-700 rounded-xl transition-colors border border-slate-200"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        if (confirm("¿Borrar recordatorio?")) deleteReminder(e.reminder.id);
                      }}
                      className="p-2 bg-slate-100 hover:bg-red-100 text-red-600 rounded-xl transition-colors border border-slate-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-300 uppercase font-black tracking-widest">
                No hay eventos para este día
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
