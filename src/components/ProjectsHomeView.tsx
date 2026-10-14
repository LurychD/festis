/**
 * Vista de Selección y Gestión de Proyectos / Obras Audiovisuales (ProjectsHomeView).
 * Unificada estéticamente con el Sistema de Diseño del espacio de trabajo interno de Festis.
 */

import React, { useState, useEffect } from 'react';
import {
  Film,
  Plus,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Calendar,
  ArrowRight,
  Loader2,
  Menu,
  X,
  Tag,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../AuthProvider';
import { Project } from '../types';
import { ProjectModal } from './ProjectModal';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { motion, AnimatePresence } from 'motion/react';
import { useDrawerSwipeGesture } from '../hooks/useDrawerSwipeGesture';

interface ProjectsHomeViewProps {
  onOpenConfig: () => void;
  onOpenHelp: () => void;
}

/**
 * Tarjeta de Obra Audiovisual con layout horizontal cinematográfico:
 * 1/3 afiche a la izquierda y 2/3 de información estructurada a la derecha.
 */
const ProjectCard: React.FC<{
  project: Project;
  onSelect: () => void;
}> = ({ project, onSelect }) => {
  const [festivalsCount, setFestivalsCount] = useState<number>(0);
  const [isLoadingCount, setIsLoadingCount] = useState<boolean>(true);

  useEffect(() => {
    if (!project.id) return;
    const festivalsRef = collection(db, 'projects', project.id, 'festivals');
    const unsubscribe = onSnapshot(
      festivalsRef,
      (snapshot) => {
        setFestivalsCount(snapshot.size);
        setIsLoadingCount(false);
      },
      (error) => {
        console.warn(`Aviso: Error al contar festivales de ${project.id}:`, error);
        setIsLoadingCount(false);
      }
    );
    return () => unsubscribe();
  }, [project.id]);

  const dominantColor = project.theme?.colorDominante || '#e91e63';

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className="group relative bg-white/75 hover:bg-white/95 backdrop-blur-xl border border-white/70 hover:border-pink-200 rounded-3xl p-4 sm:p-5 shadow-md hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 flex flex-col xs:flex-row gap-4 sm:gap-5 cursor-pointer active:scale-[0.99] overflow-hidden"
    >
      {/* 1. Columna izquierda (1/3): Afiche vertical cinematográfico */}
      <div className="w-full xs:w-32 sm:w-36 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 shrink-0 relative shadow-sm group-hover:shadow-md transition-shadow">
        {project.iconUrl ? (
          <img
            src={project.iconUrl}
            alt={project.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-3 text-white text-center relative"
            style={{
              background: `linear-gradient(145deg, ${dominantColor}, #0f172a)`,
            }}
          >
            <Film className="w-6 h-6 mb-2 opacity-80" />
            <span className="font-black text-xl tracking-tight">
              {project.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-[10px] font-semibold opacity-70 mt-1 uppercase tracking-wider">
              Afiche
            </span>
          </div>
        )}
      </div>

      {/* 2. Columna derecha (2/3): Información estructurada */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          {/* Cabecera: Badges técnicos */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-pink-50 text-[#e91e63] border border-pink-100 uppercase tracking-wider">
              Obra
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 font-mono">
                {project.fps} FPS
              </span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200/60">
                {project.resolution || '1080p'}
              </span>
            </div>
          </div>

          {/* Nombre de la obra */}
          <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#e91e63] transition-colors line-clamp-1 mb-1">
            {project.name}
          </h3>

          {/* Creador original */}
          <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5 truncate">
            <span>Creado por:</span>
            <span className="font-semibold text-slate-700 truncate">
              {project.createdBy || 'Equipo'}
            </span>
          </p>

          {/* Etiquetas (Tags) */}
          {Array.isArray(project.tags) && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {project.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60"
                >
                  <Tag className="w-2.5 h-2.5 text-slate-400" />
                  <span className="truncate max-w-[80px]">{tag}</span>
                </span>
              ))}
              {project.tags.length > 2 && (
                <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-500">
                  +{project.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pie de la tarjeta */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <div className="w-6 h-6 rounded-lg bg-pink-50 text-[#e91e63] flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            {isLoadingCount ? (
              <span className="text-slate-400 text-xs">Cargando...</span>
            ) : (
              <span>
                <strong className="text-slate-900 font-bold">{festivalsCount}</strong>{' '}
                {festivalsCount === 1 ? 'festival' : 'festivales'}
              </span>
            )}
          </div>

          <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-[#e91e63] text-slate-600 group-hover:text-white flex items-center justify-center transition-all shadow-xs group-hover:shadow-md group-hover:shadow-[#e91e63]/25">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectsHomeView: React.FC<ProjectsHomeViewProps> = ({
  onOpenConfig,
  onOpenHelp,
}) => {
  const { user, logout } = useAuth();
  const { projects, isLoadingProjects, setCurrentProject, createProject } = useProject();

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  // Gesto táctil móvil ergonómico para apertura y cierre por swipe
  useDrawerSwipeGesture({
    isOpen: isSidebarOpen,
    onOpen: () => setIsSidebarOpen(true),
    onClose: () => setIsSidebarOpen(false),
  });

  // Filtrado transversal por nombre, resolución y etiquetas
  const cleanTerm = searchTerm.toLowerCase().trim();
  const filteredProjects = projects.filter((p) => {
    if (!cleanTerm) return true;
    const matchName = (p.name || '').toLowerCase().includes(cleanTerm);
    const matchResolution = (p.resolution || '').toLowerCase().includes(cleanTerm);
    const matchTags =
      Array.isArray(p.tags) &&
      p.tags.some((tag) => tag.toLowerCase().includes(cleanTerm));
    return matchName || matchResolution || matchTags;
  });

  const handleCreateProject = async (data: any) => {
    await createProject(data);
  };

  const handleConfirmLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      {/* 1. Header flotante sólido despegado y estilizado */}
      <div className="sticky top-4 z-40 w-full px-4 flex justify-center pointer-events-none">
        <header className="pointer-events-auto w-full max-w-2xl bg-white border border-slate-200 rounded-3xl px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 shadow-md shadow-slate-900/5">
          {/* Logo / Identidad */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-[#e91e63] text-white flex items-center justify-center shadow-md shadow-[#e91e63]/25">
              <Film className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900 text-sm tracking-tight hidden xs:inline">
              Festis
            </span>
          </div>

          {/* Buscador transversal */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar obra, formato o etiquetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#e91e63] transition-all placeholder:text-slate-400 text-slate-800"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                title="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botón de apertura de drawer en extremo derecho */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            title="Abrir menú"
            className="p-2.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 active:scale-95 transition-all shadow-xs shrink-0"
          >
            <Menu className="w-4 h-4 text-slate-700" />
          </button>
        </header>
      </div>

      {/* 2. Drawer lateral reordenado con la estética institucional y Framer Motion */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop con desenfoque suave */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Panel lateral con bordes y tipografía unificados y repliegue por arrastre táctil */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              drag="x"
              dragConstraints={{ left: 0, right: 300 }}
              dragElastic={{ left: 0, right: 0.2 }}
              onDragEnd={(_e, info) => {
                if (info.offset.x > 70 || info.velocity.x > 300) {
                  setIsSidebarOpen(false);
                }
              }}
              className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col justify-between pt-12 pb-6 px-6 z-10 border-l border-slate-200"
            >
              {/* Botón de cierre */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100/50 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
                title="Cerrar panel"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Cabecera institucional idéntica al espacio interno */}
              <div className="mb-8 text-center flex flex-col items-center">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-1">
                  Festis
                  <span className="text-[#e91e63] text-xs font-semibold block mt-0.5">
                    Inicio de Catálogo
                  </span>
                </h2>
                <p className="text-xs text-slate-600 font-medium truncate max-w-full">
                  {user?.email || 'Sin sesión activa'}
                </p>

                <div className="flex flex-col items-center gap-2 mt-3">
                  <span className="text-xs px-2.5 py-0.5 rounded-full inline-block font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                    Acceso Autorizado
                  </span>
                </div>
              </div>

              {/* Navegación central con botones en formato píldora rounded-2xl */}
              <div className="flex flex-col justify-between flex-1 overflow-y-auto w-full">
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen(false);
                      onOpenConfig();
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm border-2 bg-white text-slate-600 border-slate-200 hover:border-[#e91e63] hover:bg-slate-50"
                  >
                    <Settings className="h-5 w-5 text-[#e91e63]" />
                    <span>Configuración de la App</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen(false);
                      onOpenHelp();
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm border-2 bg-white text-slate-600 border-slate-200 hover:border-blue-500 hover:bg-slate-50"
                  >
                    <HelpCircle className="h-5 w-5 text-blue-600" />
                    <span>Ayuda y Documentación</span>
                  </button>
                </div>

                {/* Pie de panel con botón de Cerrar Sesión */}
                <div className="pt-4 border-t border-slate-200 mt-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all font-bold text-sm bg-slate-900 text-white hover:bg-rose-700 shadow-md active:scale-95"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Contenido principal */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-28">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Obras Audiovisuales
          </h1>

          <span className="px-3.5 py-1 rounded-2xl text-xs font-bold bg-white/80 backdrop-blur-md border border-slate-200 text-slate-700 shadow-xs font-mono">
            {projects.length} {projects.length === 1 ? 'obra' : 'obras'}
          </span>
        </div>

        {/* Estado de Carga */}
        {isLoadingProjects ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#e91e63] mb-3" />
            <span className="text-xs font-semibold">Cargando catálogo...</span>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={() => setCurrentProject(project)}
              />
            ))}
          </div>
        ) : (
          /* Estado Vacío */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-pink-50 text-[#e91e63] flex items-center justify-center mb-3 border border-pink-100">
              <Film className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {searchTerm ? 'Sin coincidencias' : 'No hay obras registradas'}
            </h3>
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="mt-3 py-2 px-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-xs"
              >
                Limpiar búsqueda
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(true)}
                className="mt-3 py-2.5 px-6 rounded-2xl bg-[#e91e63] hover:bg-[#d81b60] text-white font-bold text-xs shadow-md shadow-[#e91e63]/25 active:scale-95 transition-all"
              >
                Crear Obra
              </button>
            )}
          </div>
        )}
      </main>

      {/* 4. Botón flotante FAB "+ Nueva Obra" */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsNewProjectModalOpen(true)}
          className="flex items-center gap-2 py-3.5 px-5 rounded-2xl bg-[#e91e63] hover:bg-[#d81b60] text-white font-bold text-xs shadow-lg shadow-[#e91e63]/30 active:scale-95 transition-all border border-pink-400/20"
          title="Crear un nuevo proyecto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nueva Obra</span>
        </button>
      </div>

      {/* Modal de Creación de Proyecto */}
      <ProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Modal de Cierre de Sesión con Temporizador de 5 Segundos */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        userEmail={user?.email || undefined}
      />
    </div>
  );
};
