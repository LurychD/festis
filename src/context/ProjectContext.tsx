/**
 * Contexto de gestión de proyectos y obras audiovisuales multi-tenant.
 * Escucha en tiempo real la colección /projects, normaliza roles y gestiona el proyecto activo.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthProvider';
import { Project, ProjectThemeConfig, ProjectMember, ProjectRole, ProjectInvitation } from '../types';

export const normalizeRole = (role: string): ProjectRole => {
  switch (role) {
    case 'owner':
    case 'admin':
      return 'owner';
    case 'distribuidor':
    case 'dev':
      return 'distribuidor';
    case 'colaborador':
    case 'visitante':
      return 'colaborador';
    case 'guest':
    case 'externo':
    default:
      return 'guest';
  }
};

export const computeRoleUids = (
  members: ProjectMember[],
  createdByEmail: string,
  creatorUid?: string
) => {
  const ownerUids = new Set<string>();
  const distributorUids = new Set<string>();
  const collaboratorUids = new Set<string>();
  const guestUids = new Set<string>();
  const authorizedUsers = new Set<string>();

  if (creatorUid) {
    ownerUids.add(creatorUid);
  }
  if (createdByEmail) {
    authorizedUsers.add(createdByEmail.toLowerCase().trim());
  }

  members.forEach((m) => {
    const email = m.email.toLowerCase().trim();
    if (email) authorizedUsers.add(email);

    const normRole = normalizeRole(m.role);
    if (m.uid) {
      if (normRole === 'owner') ownerUids.add(m.uid);
      else if (normRole === 'distribuidor') distributorUids.add(m.uid);
      else if (normRole === 'colaborador') collaboratorUids.add(m.uid);
      else guestUids.add(m.uid);
    }
  });

  return {
    ownerUids: Array.from(ownerUids),
    distributorUids: Array.from(distributorUids),
    collaboratorUids: Array.from(collaboratorUids),
    guestUids: Array.from(guestUids),
    authorizedUsers: Array.from(authorizedUsers),
  };
};

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

export interface ProjectRoleState {
  role: ProjectRole;
  isOwner: boolean;
  isDistributor: boolean;
  isCollaborator: boolean;
  isGuest: boolean;
}

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  isLoadingProjects: boolean;
  userProjectRole: ProjectRoleState;
  setCurrentProject: (project: Project | null) => void;
  selectProjectById: (projectId: string) => void;
  createProject: (data: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  updateMemberRole: (projectId: string, email: string, newRole: ProjectRole) => Promise<void>;
  removeMember: (projectId: string, email: string) => Promise<void>;
  inviteMember: (projectId: string, email: string, initialRole: ProjectRole) => Promise<void>;
  createInviteLink: (projectId: string, role: ProjectRole, targetEmail?: string) => Promise<{ token: string; inviteUrl: string }>;
  acceptInvite: (token: string) => Promise<{ success: boolean; projectName: string; role: ProjectRole }>;
  deleteProject: (id: string) => Promise<void>;
}

const defaultRoleState: ProjectRoleState = {
  role: 'guest',
  isOwner: false,
  isDistributor: false,
  isCollaborator: false,
  isGuest: true,
};

const ProjectContext = createContext<ProjectContextType>({
  currentProject: null,
  projects: [],
  isLoadingProjects: true,
  userProjectRole: defaultRoleState,
  setCurrentProject: () => {},
  selectProjectById: () => {},
  createProject: async () => { throw new Error('Contexto no inicializado'); },
  updateProject: async () => {},
  updateMemberRole: async () => {},
  removeMember: async () => {},
  inviteMember: async () => {},
  createInviteLink: async () => { throw new Error('Contexto no inicializado'); },
  acceptInvite: async () => { throw new Error('Contexto no inicializado'); },
  deleteProject: async () => {},
});

export const useProject = () => useContext(ProjectContext);

export const useProjectRole = (): ProjectRoleState => {
  const { userProjectRole } = useContext(ProjectContext);
  return userProjectRole;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem('festis_active_project_id');
  });

  const userEmail = useMemo(() => {
    return (
      user?.email?.toLowerCase().trim() ||
      localStorage.getItem('userEmail')?.toLowerCase().trim() ||
      'axeldibarra@gmail.com'
    );
  }, [user?.email]);

  const isGlobalAdmin = useMemo(() => {
    return (
      userEmail === 'axeldibarra@gmail.com' ||
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

    // Administrador ve todos los proyectos; usuarios estándar consultan por pertenencia
    const q = isGlobalAdmin
      ? projectsRef
      : query(projectsRef, where('authorizedUsers', 'array-contains', userEmail));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: Project[] = [];
        snapshot.forEach((docSnap) => {
          const raw = docSnap.data() as any;
          // Normalización transparente de roles legados
          const normalizedMembers: ProjectMember[] = (raw.members || []).map((m: any) => ({
            email: m.email,
            uid: m.uid || (m.email.toLowerCase() === userEmail ? user?.uid : undefined),
            role: normalizeRole(m.role),
            displayName: m.displayName,
            addedAt: m.addedAt,
          }));

          loaded.push({
            ...raw,
            id: docSnap.id,
            members: normalizedMembers,
            ownerUids: raw.ownerUids || [],
            distributorUids: raw.distributorUids || [],
            collaboratorUids: raw.collaboratorUids || [],
            guestUids: raw.guestUids || [],
            authorizedUsers: raw.authorizedUsers || [raw.createdBy],
          });
        });

        // Ordenamiento por fecha de creación decreciente
        loaded.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setProjects(loaded);
        setIsLoadingProjects(false);
      },
      (error) => {
        console.error('Error al escuchar la colección /projects:', error);
        setIsLoadingProjects(false);
      }
    );

    return () => unsubscribe();
  }, [user, userEmail, isGlobalAdmin]);

  // Proyecto activo seleccionado
  const currentProject = useMemo(() => {
    if (!activeProjectId) return null;
    return projects.find((p) => p.id === activeProjectId) || null;
  }, [activeProjectId, projects]);

  // Cálculo dinámico del rol del usuario autenticado en el proyecto activo
  const userProjectRole = useMemo<ProjectRoleState>(() => {
    if (isGlobalAdmin) {
      return {
        role: 'owner',
        isOwner: true,
        isDistributor: true,
        isCollaborator: true,
        isGuest: true,
      };
    }

    if (!currentProject) {
      return defaultRoleState;
    }

    const isCreator = currentProject.createdBy?.toLowerCase().trim() === userEmail;
    if (isCreator) {
      return {
        role: 'owner',
        isOwner: true,
        isDistributor: true,
        isCollaborator: true,
        isGuest: true,
      };
    }

    const member = currentProject.members?.find(
      (m) =>
        m.email?.toLowerCase().trim() === userEmail ||
        (user?.uid && m.uid === user.uid)
    );

    if (!member) {
      return defaultRoleState;
    }

    const role = normalizeRole(member.role);
    return {
      role,
      isOwner: role === 'owner',
      isDistributor: role === 'owner' || role === 'distribuidor',
      isCollaborator: role === 'owner' || role === 'distribuidor' || role === 'colaborador',
      isGuest: true,
    };
  }, [isGlobalAdmin, currentProject, userEmail, user?.uid]);

  // Auto-enlace de UID en segundo plano para invitados cuando acceden por primera vez
  useEffect(() => {
    if (!user || !user.uid || !currentProject) return;

    const memberIndex = currentProject.members?.findIndex(
      (m) => m.email?.toLowerCase().trim() === userEmail && !m.uid
    );

    if (memberIndex !== undefined && memberIndex >= 0) {
      const updatedMembers = [...currentProject.members];
      updatedMembers[memberIndex] = {
        ...updatedMembers[memberIndex],
        uid: user.uid,
      };

      const roleUids = computeRoleUids(
        updatedMembers,
        currentProject.createdBy,
        currentProject.createdBy === userEmail ? user.uid : undefined
      );

      const docRef = doc(db, 'projects', currentProject.id);
      updateDoc(docRef, {
        members: updatedMembers,
        ...roleUids,
      }).catch((e) => console.warn('Auto-enlace de UID diferido:', e.message));
    }
  }, [user, userEmail, currentProject]);

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
        root.style.setProperty(
          '--project-bg-custom',
          `url("${currentProject.theme.valorFondo}") center/cover no-repeat fixed`
        );
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
        uid: user?.uid,
        role: 'owner',
        addedAt: nowIso,
      },
    ];

    if (data.initialMemberEmails) {
      data.initialMemberEmails.forEach((email) => {
        const clean = email.toLowerCase().trim();
        if (clean && clean !== userEmail) {
          initialMembers.push({
            email: clean,
            role: 'colaborador',
            addedAt: nowIso,
          });
        }
      });
    }

    const roleUids = computeRoleUids(initialMembers, userEmail, user?.uid);

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
      ...roleUids,
      theme: defaultTheme,
      tags: data.tags || [],
      description: data.description || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const projectDocRef = doc(db, 'projects', projectId);
    await setDoc(projectDocRef, newProject);

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

    if (updates.members) {
      const proj = projects.find((p) => p.id === id);
      const createdByEmail = proj?.createdBy || userEmail;
      const roleUids = computeRoleUids(updates.members, createdByEmail, user?.uid);
      Object.assign(sanitizedUpdates, roleUids);
    }

    await updateDoc(projectDocRef, sanitizedUpdates);
  };

  // Conmutar rol de miembro con sincronización en tiempo real de arrays planos
  const updateMemberRole = async (
    projectId: string,
    email: string,
    newRole: ProjectRole
  ): Promise<void> => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Proyecto no encontrado');

    const cleanEmail = email.toLowerCase().trim();
    const updatedMembers = proj.members.map((m) =>
      m.email.toLowerCase().trim() === cleanEmail ? { ...m, role: newRole } : m
    );

    const roleUids = computeRoleUids(updatedMembers, proj.createdBy, user?.uid);
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
      members: updatedMembers,
      ...roleUids,
      updatedAt: new Date().toISOString(),
    });
  };

  // Desvincular miembro de la obra con salvaguarda
  const removeMember = async (projectId: string, email: string): Promise<void> => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Proyecto no encontrado');

    const cleanEmail = email.toLowerCase().trim();
    const memberToRemove = proj.members.find((m) => m.email.toLowerCase().trim() === cleanEmail);
    if (!memberToRemove) return;

    if (memberToRemove.role === 'owner') {
      const ownersCount = proj.members.filter((m) => m.role === 'owner').length;
      if (ownersCount <= 1) {
        throw new Error('No es posible eliminar al único Owner de la obra.');
      }
    }

    const updatedMembers = proj.members.filter(
      (m) => m.email.toLowerCase().trim() !== cleanEmail
    );

    const roleUids = computeRoleUids(updatedMembers, proj.createdBy, user?.uid);
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
      members: updatedMembers,
      ...roleUids,
      updatedAt: new Date().toISOString(),
    });
  };

  // Invitar o asociar nuevo miembro a la obra
  const inviteMember = async (
    projectId: string,
    email: string,
    initialRole: ProjectRole
  ): Promise<void> => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Proyecto no encontrado');

    const cleanEmail = email.toLowerCase().trim();
    if (proj.members.some((m) => m.email.toLowerCase().trim() === cleanEmail)) {
      throw new Error('El usuario ya pertenece a este proyecto.');
    }

    const newMember: ProjectMember = {
      email: cleanEmail,
      role: initialRole,
      addedAt: new Date().toISOString(),
    };

    const updatedMembers = [...proj.members, newMember];
    const roleUids = computeRoleUids(updatedMembers, proj.createdBy, user?.uid);

    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
      members: updatedMembers,
      ...roleUids,
      updatedAt: new Date().toISOString(),
    });
  };

  // Generar un Enlace Mágico de Invitación (Magic Invite Link)
  const createInviteLink = async (
    projectId: string,
    role: ProjectRole,
    targetEmail?: string
  ): Promise<{ token: string; inviteUrl: string }> => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Obra audiovisual no encontrada.');

    const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Vence en 7 días

    const inviteDoc: ProjectInvitation = {
      id: token,
      projectId,
      projectName: proj.name,
      role,
      targetEmail: targetEmail?.toLowerCase().trim() || undefined,
      createdBy: userEmail,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      used: false,
    };

    await setDoc(doc(db, 'project_invitations', token), inviteDoc);

    const origin = window.location.origin;
    const inviteUrl = `${origin}/?invite=${token}`;
    return { token, inviteUrl };
  };

  // Aceptar y redimir una invitación
  const acceptInvite = async (
    token: string
  ): Promise<{ success: boolean; projectName: string; role: ProjectRole }> => {
    if (!user || !userEmail) {
      throw new Error('Debe iniciar sesión para aceptar la invitación.');
    }

    const inviteRef = doc(db, 'project_invitations', token);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) {
      throw new Error('El enlace de invitación no existe o es inválido.');
    }

    const inviteData = inviteSnap.data() as ProjectInvitation;

    if (inviteData.used) {
      throw new Error('Este enlace de invitación ya ha sido utilizado.');
    }

    if (new Date(inviteData.expiresAt).getTime() < Date.now()) {
      throw new Error('Este enlace de invitación ha expirado.');
    }

    if (
      inviteData.targetEmail &&
      inviteData.targetEmail.toLowerCase().trim() !== userEmail
    ) {
      throw new Error(
        `Esta invitación fue emitida exclusivamente para ${inviteData.targetEmail}.`
      );
    }

    const projectRef = doc(db, 'projects', inviteData.projectId);
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) {
      throw new Error('La obra asociada a esta invitación ya no existe.');
    }

    const projectData = projectSnap.data() as Project;
    const members = projectData.members || [];
    const existingIndex = members.findIndex(
      (m) => m.email.toLowerCase().trim() === userEmail
    );

    let updatedMembers = [...members];
    if (existingIndex >= 0) {
      updatedMembers[existingIndex] = {
        ...updatedMembers[existingIndex],
        uid: user.uid,
        role: inviteData.role,
      };
    } else {
      updatedMembers.push({
        email: userEmail,
        uid: user.uid,
        role: inviteData.role,
        addedAt: new Date().toISOString(),
      });
    }

    const roleUids = computeRoleUids(
      updatedMembers,
      projectData.createdBy,
      user.uid
    );

    // Actualizar el proyecto incorporando al usuario
    await updateDoc(projectRef, {
      members: updatedMembers,
      ...roleUids,
      updatedAt: new Date().toISOString(),
    });

    // Marcar el token como canjeado
    await updateDoc(inviteRef, {
      used: true,
      usedBy: user.uid,
      usedByEmail: userEmail,
      usedAt: new Date().toISOString(),
    });

    selectProjectById(inviteData.projectId);

    return {
      success: true,
      projectName: inviteData.projectName,
      role: inviteData.role,
    };
  };

  // Eliminar un proyecto por completo
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
        userProjectRole,
        setCurrentProject,
        selectProjectById,
        createProject,
        updateProject,
        updateMemberRole,
        removeMember,
        inviteMember,
        createInviteLink,
        acceptInvite,
        deleteProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
