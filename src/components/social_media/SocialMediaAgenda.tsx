import React, { useMemo } from "react";
import { SocialPost, Festival } from "../../types";
import { format, isAfter, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckSquare,
  Edit3,
  Hash,
  Image as ImageIcon,
  Link,
  Music,
  Video,
  Calendar,
  Clock,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  FileText,
  Activity,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../utils/helpers";

interface SocialMediaAgendaProps {
  posts: SocialPost[];
  festivals: Festival[];
  onNavigateToBoard: () => void;
}

export const SocialMediaAgenda: React.FC<SocialMediaAgendaProps> = ({
  posts,
  festivals,
  onNavigateToBoard,
}) => {
  const stats = useMemo(() => {
    return {
      total: posts.length,
      published: posts.filter((p) => p.status === "published").length,
      pending: posts.filter((p) => p.status === "pending").length,
      draft: posts.filter((p) => p.status === "draft").length,
    };
  }, [posts]);

  const upcomingPosts = useMemo(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return posts
      .filter((p) => {
          if (p.status === "draft" || !p.scheduledDate) return false;
          const scheduled = new Date(p.scheduledDate).getTime();
          
          if (scheduled > nextWeek.getTime()) return false;
          if (scheduled < new Date().setHours(0,0,0,0) && p.status === "published") return false;
          
          return true;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledDate!).getTime() -
          new Date(b.scheduledDate!).getTime(),
      );
  }, [posts]);

  const recentDrafts = useMemo(() => {
    return posts
      .filter((p) => p.status === "draft")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 4);
  }, [posts]);

  const typeStats = useMemo(() => {
    const counts = posts.reduce(
      (acc, post) => {
        acc[post.type] = (acc[post.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "text":
        return <Edit3 className="h-5 w-5" />;
      case "link":
        return <Link className="h-5 w-5" />;
      case "music":
        return <Music className="h-5 w-5" />;
      case "task":
        return <CheckSquare className="h-5 w-5" />;
      default:
        return <Hash className="h-5 w-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "published":
        return "Publicado";
      case "pending":
        return "Pendiente";
      case "draft":
        return "Borrador";
      default:
        return status;
    }
  };

  const getStatusColor = (status: SocialPost["status"]) => {
    switch (status) {
      case "published":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "draft":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getTimeFrameInfo = (dateStr: string, status: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    
    if (d.getTime() < now.getTime() && status !== "published") {
      return { label: 'Atrasada', color: 'bg-red-100 text-red-700 border-red-200' };
    } else if (isSameDay(d, now)) {
      return { label: 'Hoy', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    } else if (d.getTime() < now.getTime() && status === "published") {
      return { label: 'Anterior', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    } else {
      return { label: 'Próxima', color: 'bg-sky-100 text-sky-700 border-sky-200' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-8">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-sky-500" /> Próximas Publicaciones
          </h3>

          <div className="flex flex-col gap-6">
            {upcomingPosts.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <Calendar className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">
                  No hay publicaciones programadas a futuro.
                </p>
              </div>
            ) : (
              <div className="relative pl-5 sm:pl-8 before:absolute before:top-2 before:bottom-0 before:left-2 sm:before:left-3 before:w-0.5 before:bg-slate-200 flex flex-col gap-10 pb-4">
                {Object.entries(
                  upcomingPosts.reduce((acc, post) => {
                    const d = new Date(post.scheduledDate!);
                    const dateStr = format(d, "EEEE d 'de' MMMM", { locale: es });
                    if (!acc[dateStr]) acc[dateStr] = [];
                    acc[dateStr].push(post);
                    return acc;
                  }, {} as Record<string, SocialPost[]>)
                ).map(([dateStr, dayPosts], groupIdx) => (
                  <div key={`${dateStr}-${groupIdx}`} className="relative">
                    <div className="absolute w-3 h-3 rounded-full bg-sky-400 border-[2px] border-white left-[-1.0625rem] sm:left-[-1.5625rem] top-1 shadow-sm"></div>
                    <h4 className="text-sm font-black text-slate-800 capitalize mb-4 inline-block bg-white pr-4">
                      {dateStr}
                    </h4>

                    <div className="flex flex-col gap-4">
                      {dayPosts.map((post, idx) => {
                        const festival = festivals.find(f => f.id === post.associatedFestivalId);
                        const timeInfo = getTimeFrameInfo(post.scheduledDate!, post.status);
                        
                        return (
                          <div key={`ag-post-${dateStr}-${post.id || 'p'}-${idx}`} className="relative pl-2 sm:pl-4 flex flex-col gap-2">
                            <div className="absolute w-2 h-2 rounded-full bg-slate-300 left-[-0.9375rem] sm:left-[-1.4375rem] top-3"></div>
                            
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="text-sm font-black text-slate-800 shadow-sm bg-white border border-slate-100 px-2 py-0.5 rounded-lg">
                                {format(new Date(post.scheduledDate!), "HH:mm")} hs
                              </span>
                              {festival && (
                                <span className="text-[11px] font-bold text-slate-500">
                                  • {festival.name}
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${getStatusColor(post.status)}`}>
                                {getStatusLabel(post.status)}
                              </span>
                              {timeInfo.label === 'Atrasada' && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 bg-red-100 text-red-700 border-red-200">
                                  {timeInfo.label}
                                </span>
                              )}
                            </div>

                            <div
                              onClick={onNavigateToBoard}
                              className={cn("p-4 rounded-[1.5rem] border shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col gap-3",
                                post.status === "published" && "border-emerald-200",
                                timeInfo.label === "Anterior" && "opacity-50 grayscale hover:grayscale-0 hover:opacity-100"
                              )}
                              style={{
                                backgroundColor:
                                  post.status === "published"
                                    ? "#ecfdf5"
                                    : post.color && post.color !== "#ffffff"
                                      ? post.color
                                      : "#f8fafc",
                                borderColor: post.status === "published" ? "#a7f3d0" : undefined,
                                color: post.color && post.color !== "#ffffff" ? "#000000bb" : "#334155",
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-white/50 text-sky-600 rounded-xl backdrop-blur-sm self-start shrink-0">
                                  {getTypeIcon(post.type)}
                                </div>
                                <p className="font-medium text-sm flex-1 mt-1 whitespace-pre-wrap break-words overflow-hidden">
                                  {post.content || "Sin contenido de texto..."}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-500" /> Borradores
              Recientes
            </h3>
            <div className="flex flex-col gap-3">
              {recentDrafts.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">
                  No hay borradores recientes
                </p>
              ) : (
                recentDrafts.map((post, idx) => (
                  <div
                    key={`draft-${post.id || 'd'}-${idx}`}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex gap-3 items-center group transition-colors hover:bg-slate-100 cursor-default"
                  >
                    <div className="text-slate-400">
                      {getTypeIcon(post.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {post.content || "Borrador sin texto"}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                        Hace{" "}
                        {Math.round(
                          (new Date().getTime() -
                            new Date(post.createdAt).getTime()) /
                            (1000 * 60 * 60 * 24),
                        )}{" "}
                        días
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
