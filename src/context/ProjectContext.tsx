/**
 * Contexto de gestión de proyectos y obras audiovisuales multi-tenant.
 * Escucha en tiempo real la colección /projects y gestiona el proyecto activo.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthProvider';
import { Project, ProjectThemeConfig, ProjectMember } from '../types';

interface CreateProjectInput {
  name: string;
  fps: number;
  resolution: string;
  iconUrl?: string;
  theme?: Partial<ProjectThemeConfig>;
  initialMemberEmails?: string[];
  tags?: string[];
  description?: string;
}

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  isLoadingProjects: boolean;
  setCurrentProject: (project: Project | null) => void;
  selectProjectById: (projectId: string) => void;
  createProject: (data: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
  currentProject: null,
  projects: [],
  isLoadingProjects: true,
  setCurrentProject: () => {},
  selectProjectById: () => {},
  createProject: async () => { throw new Error('Contexto no inicializado'); },
  updateProject: async () => {},
  deleteProject: async () => {},
});

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem('festis_active_project_id');
  });

  const userEmail = useMemo(() => {
    return user?.email?.toLowerCase().trim() || '';
  }, [user?.email]);

  const isAdmin = useMemo(() => {
    return (
      userEmail === 'axeldibarra@gmail.com' ||
      userEmail === 'luciaruocco1313@gmail.com' ||
      user?.uid === 'IslcgZ6p0hRom8hSsZ9scw30tD12'
    );
  }, [userEmail, user?.uid]);

  // Suscripción en tiempo real a la colección /projects
  useEffect(() => {
    if (!user || !userEmail) {
      setProjects([]);
      setIsLoadingProjects(false);
      return;
    }

    setIsLoadingProjects(true);
    const projectsRef = collection(db, 'projects');

    // Los administradores pueden ver todos los proyectos; los usuarios estándar consultan por authorizedUsers
    const q = isAdmin
      ? projectsRef
      : query(projectsRef, where('authorizedUsers', 'array-contains', userEmail));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: Project[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Project;
          loaded.push({
            ...data,
            id: docSnap.id,
          });
        });

        // Ordenamiento seguro en cliente por fecha de creación decreciente
        loaded.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setProjects(loaded);
        setIsLoadingProjects(false);
      },
      (error) => {
        console.error('Error al escuchar la colección /projects:', error);
        setIsLoadingProjects(false);
      }
    );

    return () => unsubscribe();
  }, [user, userEmail, isAdmin]);

  // Proyecto actualmente seleccionado resuelto de la lista reactiva
  const currentProject = useMemo(() => {
    if (!activeProjectId) return null;
    return projects.find((p) => p.id === activeProjectId) || null;
  }, [activeProjectId, projects]);

  // Aplicar variables cromáticas del proyecto activo al elemento raíz HTML
  useEffect(() => {
    const root = document.documentElement;
    if (currentProject?.theme) {
      root.style.setProperty('--project-color-dominant', currentProject.theme.colorDominante);
      root.style.setProperty('--project-color-sub', currentProject.theme.colorSub);
      root.style.setProperty('--project-color-accent', currentProject.theme.colorAcento);

      if (currentProject.theme.tipoFondo === 'solido') {
        root.style.setProperty('--project-bg-custom', currentProject.theme.valorFondo);
      } else if (currentProject.theme.tipoFondo === 'imagen') {
        root.style.setProperty('--project-bg-custom', `url("${currentProject.theme.valorFondo}") center/cover no-repeat fixed`);
      } else {
        root.style.removeProperty('--project-bg-custom');
      }
    } else {
      root.style.removeProperty('--project-color-dominant');
      root.style.removeProperty('--project-color-sub');
      root.style.removeProperty('--project-color-accent');
      root.style.removeProperty('--project-bg-custom');
    }
  }, [currentProject]);

  const setCurrentProject = (project: Project | null) => {
    if (project) {
      setActiveProjectId(project.id);
      localStorage.setItem('festis_active_project_id', project.id);
    } else {
      setActiveProjectId(null);
      localStorage.removeItem('festis_active_project_id');
    }
  };

  const selectProjectById = (projectId: string) => {
    setActiveProjectId(projectId);
    localStorage.setItem('festis_active_project_id', projectId);
  };

  // Crear un nuevo proyecto en /projects/{projectId}
  const createProject = async (data: CreateProjectInput): Promise<Project> => {
    if (!userEmail) {
      throw new Error('Debe iniciar sesión para crear un proyecto.');
    }

    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const nowIso = new Date().toISOString();

    const initialMembers: ProjectMember[] = [
      {
        email: userEmail,
        role: 'admin',
      },
    ];

    const authorizedUsersSet = new Set<string>([userEmail]);
    if (data.initialMemberEmails) {
      data.initialMemberEmails.forEach((email) => {
        const clean = email.toLowerCase().trim();
        if (clean && !authorizedUsersSet.has(clean)) {
          authorizedUsersSet.add(clean);
          initialMembers.push({
            email: clean,
            role: 'dev',
          });
        }
      });
    }

    const defaultTheme: ProjectThemeConfig = {
      colorDominante: data.theme?.colorDominante || '#e91e63',
      colorSub: data.theme?.colorSub || '#bae6fd',
      colorAcento: data.theme?.colorAcento || '#fef08a',
      tipoFondo: data.theme?.tipoFondo || 'solido',
      valorFondo: data.theme?.valorFondo || '#f8fafc',
    };

    const newProject: Project = {
      id: projectId,
      name: data.name.trim(),
      iconUrl: data.iconUrl || '',
      fps: Number(data.fps) || 24,
      resolution: data.resolution || '1920x1080',
      createdBy: userEmail,
      members: initialMembers,
      authorizedUsers: Array.from(authorizedUsersSet),
      theme: defaultTheme,
      tags: data.tags || [],
      description: data.description || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const projectDocRef = doc(db, 'projects', projectId);
    await setDoc(projectDocRef, newProject);

    // Activar inmediatamente el proyecto recién creado
    setCurrentProject(newProject);
    return newProject;
  };

  // Actualizar metadatos, tema o miembros del proyecto
  const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
    const projectDocRef = doc(db, 'projects', id);
    const sanitizedUpdates: Record<string, any> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Asegurar sincronización estricta entre members y authorizedUsers
    if (updates.members) {
      sanitizedUpdates.authorizedUsers = Array.from(
        new Set(updates.members.map((m) => m.email.toLowerCase().trim()))
      );
    }

    await updateDoc(projectDocRef, sanitizedUpdates);
  };

  // Eliminar un proyecto
  const deleteProject = async (id: string): Promise<void> => {
    const projectDocRef = doc(db, 'projects', id);
    await deleteDoc(projectDocRef);
    if (activeProjectId === id) {
      setCurrentProject(null);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        isLoadingProjects,
        setCurrentProject,
        selectProjectById,
        createProject,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
