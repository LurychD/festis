/**
 * Vista Exclusiva de Selección y Gestión de Proyectos / Obras Audiovisuales (ProjectsHomeView).
 * Se despliega cuando no hay un proyecto activo en sesión.
 * 
 * Ergonomía táctil para mano derecha en celulares:
 * - Header flotante propio: Despegado de los bordes superiores y laterales (sticky top-3 left-0 right-0 mx-4 max-w-xl),
 *   con bordes redondeados (rounded-2xl), sombra sutil y desenfoque (backdrop-blur-xl).
 * - Buscador transversal integrado: Filtra en tiempo real por nombre de obra, resolución técnica y etiquetas/tags.
 * - Botón para desplegar la sidebar ubicado en el extremo DERECHO del header flotante para fácil alcance con el pulgar.
 * - Botón flotante FAB "+ Nuevo Proyecto" ubicado abajo a la derecha de la pantalla (fixed bottom-6 right-6 z-40).
 * - Panel lateral (drawer) de inicio abre y se anima desde el lateral DERECHO de la pantalla (slide-in-from-right).
 * - Limpieza total de acciones: Eliminada cualquier referencia o botón de creación de festivales en el inicio.
 * - Opciones de la sidebar de inicio: Exactamente 3 elementos:
 *   1. Configuración de la App (navega hacia AppSettingsView).
 *   2. Ayuda.
 *   3. Cerrar Sesión (ubicado abajo de todo, con modal de confirmación y temporizador de 5 segundos).
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
  Layers,
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

interface ProjectsHomeViewProps {
  onOpenConfig: () => void;
  onOpenHelp: () => void;
}

// Subcomponente de tarjeta de proyecto con conteo reactivo de festivales en su subcolección
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
      className="group relative bg-white/80 hover:bg-white backdrop-blur-xl border border-slate-200/80 hover:border-pink-300 rounded-[2rem] p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-[0.98] overflow-hidden"
    >
      {/* Indicador de acento de la paleta de la obra */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 opacity-80 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: dominantColor }}
      />

      <div>
        {/* Cabecera de la tarjeta: Ícono y badges técnicos */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            {project.iconUrl ? (
              <img
                src={project.iconUrl}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white font-black text-xl"
                style={{ backgroundColor: dominantColor }}
              >
                {project.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60 font-mono">
              {project.fps} FPS
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-500 border border-slate-200/40">
              {project.resolution || '1080p'}
            </span>
          </div>
        </div>

        {/* Nombre del proyecto */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-pink-600 transition-colors mb-2 line-clamp-1">
          {project.name}
        </h3>

        {/* Creador */}
        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
          <span>Creado por:</span>
          <span className="font-semibold text-slate-700 truncate max-w-[180px]">
            {project.createdBy || 'Equipo'}
          </span>
        </p>

        {/* Etiquetas / Tags de la obra */}
        {Array.isArray(project.tags) && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {project.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-medium bg-slate-100 text-slate-600 border border-slate-200/50"
              >
                <Tag className="w-2.5 h-2.5 text-slate-400" />
                <span>{tag}</span>
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-lg text-[10.5px] font-medium bg-slate-100 text-slate-500">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer de la tarjeta: Contador de festivales y botón entrar */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <div className="w-6 h-6 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          {isLoadingCount ? (
            <span className="text-slate-400">Contando...</span>
          ) : (
            <span>
              <strong className="text-slate-900 font-bold">{festivalsCount}</strong>{' '}
              {festivalsCount === 1 ? 'festival' : 'festivales'}
            </span>
          )}
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-pink-600 text-slate-500 group-hover:text-white flex items-center justify-center transition-all shadow-xs">
          <ArrowRight className="w-4 h-4" />
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

  // Filtrado transversal en tiempo real: nombre de la obra, resolución técnica y etiquetas/tags
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
    <div className="min-h-screen w-full flex flex-col bg-slate-50/60 relative">
      {/* 1. APP HEADER FLOTANTE PROPIO (Despegado, rounded-2xl, sticky top-3 con desenfoque y ergonomía diestra) */}
      <div className="sticky top-3 z-40 w-full px-4 flex justify-center pointer-events-none">
        <header className="pointer-events-auto w-full max-w-xl bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 shadow-md">
          {/* Logo / Identidad */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center shadow-xs">
              <Film className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900 text-base tracking-tight hidden xs:inline">
              Festis
            </span>
          </div>

          {/* Buscador transversal: Filtra en tiempo real por obra, resolución técnica y tags */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar obra, resolución o tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-100/90 hover:bg-white focus:bg-white border border-slate-200/80 text-xs sm:text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder:text-slate-400 text-slate-800"
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

          {/* Ergonomía para mano derecha: Botón para desplegar la sidebar en el extremo DERECHO */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            title="Abrir menú lateral"
            className="p-2 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 text-slate-700 active:scale-95 transition-all shadow-2xs shrink-0"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
        </header>
      </div>

      {/* 2. SIDEBAR LATERAL (DRAWER) QUE ABRE Y SE ANIMA DESDE LA DERECHA */}
      {/* Contiene ÚNICAMENTE: "Configuración de la App", "Ayuda" y abajo de todo "Cerrar Sesión" */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop con desenfoque */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Panel Lateral Drawer desde el lateral DERECHO */}
          <aside className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between p-6 z-10 border-l border-slate-100 animate-in slide-in-from-right duration-200">
            {/* Cabecera de la Sidebar */}
            <div>
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-pink-600 text-white flex items-center justify-center shadow-md shadow-pink-600/30">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 text-base">Festis</h2>
                    <p className="text-xs text-slate-500 font-medium">Panel de Inicio</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  title="Cerrar panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Elementos de Navegación Exclusivos: 1. Configuración de la App, 2. Ayuda */}
              <nav className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    onOpenConfig();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-700 hover:text-pink-600 hover:bg-pink-50/60 active:scale-98 transition-all font-semibold text-sm border border-transparent hover:border-pink-100 text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span>Configuración de la App</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Ajustes globales y respaldo
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    onOpenHelp();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-700 hover:text-pink-600 hover:bg-pink-50/60 active:scale-98 transition-all font-semibold text-sm border border-transparent hover:border-pink-100 text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span>Ayuda</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Documentación y soporte técnico
                    </span>
                  </div>
                </button>
              </nav>
            </div>

            {/* 3. Cerrar Sesión (Abajo de todo con confirmación y cuenta regresiva de 5s) */}
            <div className="pt-4 border-t border-slate-100">
              {user && (
                <div className="mb-3 px-2">
                  <p className="text-[11px] text-slate-400 font-medium">Sesión activa</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{user.email}</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  setIsLogoutModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-rose-600 hover:bg-rose-50 active:scale-98 transition-all font-semibold text-sm border border-rose-100 text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span>Cerrar Sesión</span>
                  <span className="text-[11px] text-rose-400 font-normal">
                    Salir de forma segura
                  </span>
                </div>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 3. CONTENIDO PRINCIPAL: Catálogo de Obras */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-28 flex flex-col">
        {/* Cabecera del catálogo: Título y conteo de obras */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-600 mb-1">
              <Layers className="w-4 h-4" />
              <span>Obras Audiovisuales</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Catálogo de Proyectos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Ingresa al entorno de una obra para gestionar sus festivales, presupuestos y materiales.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-600 shadow-2xs font-mono">
              {projects.length} {projects.length === 1 ? 'obra activa' : 'obras activas'}
            </span>
          </div>
        </div>

        {/* Estado de Carga */}
        {isLoadingProjects ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600 mb-3" />
            <span className="text-sm font-medium">Cargando catálogo de obras...</span>
          </div>
        ) : filteredProjects.length > 0 ? (
          /* Grilla de Tarjetas de Proyectos */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center bg-white/60 backdrop-blur-xl border border-slate-200/80 rounded-[2.5rem] shadow-xs">
            <div className="w-20 h-20 rounded-3xl bg-pink-50 text-pink-600 flex items-center justify-center mb-4 border border-pink-100">
              <Film className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {searchTerm ? 'No se encontraron obras coincidentes' : 'No hay obras creadas aún'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
              {searchTerm
                ? 'No encontramos coincidencias para esa búsqueda por nombre, resolución o etiqueta. Prueba con otro término.'
                : 'Registra tu primera obra audiovisual para comenzar a organizar sus postulaciones, inscripciones y calendarios.'}
            </p>
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="py-2.5 px-6 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all"
              >
                Limpiar búsqueda
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(true)}
                className="py-3 px-8 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm shadow-lg shadow-pink-600/25 active:scale-95 transition-all"
              >
                Registrar Nueva Obra
              </button>
            )}
          </div>
        )}
      </main>

      {/* 4. BOTÓN FLOTANTE FAB "+ NUEVO PROYECTO" FIJO ABAJO A LA DERECHA (Ergonomía pulgar mano derecha) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsNewProjectModalOpen(true)}
          className="flex items-center gap-2.5 py-3.5 px-5 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-black text-sm shadow-xl shadow-pink-600/35 active:scale-95 transition-all border border-pink-400/30"
          title="Crear un nuevo proyecto"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>Nuevo Proyecto</span>
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
