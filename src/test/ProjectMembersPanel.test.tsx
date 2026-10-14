import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { ProjectMembersPanel } from '../components/ProjectMembersPanel';

// Mock de Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn((_q, callback) => {
    callback({
      forEach: vi.fn(),
    });
    return vi.fn(); // Unsubscribe mock
  }),
  doc: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

// Mock del contexto de Proyecto
const mockCurrentProject = {
  id: 'proj_smoke_test',
  name: 'Obra de Prueba',
  createdBy: 'director@festis.app',
  members: [
    {
      uid: 'user_owner_1',
      email: 'director@festis.app',
      displayName: 'Director Axel',
      role: 'owner' as const,
      joinedAt: Date.now(),
    },
    {
      uid: 'user_collab_1',
      email: 'editor@festis.app',
      displayName: 'Editor Audiovisual',
      role: 'colaborador' as const,
      joinedAt: Date.now(),
    },
  ],
  ownerUids: ['user_owner_1'],
  collaboratorUids: ['user_collab_1'],
};

const mockUseProject = vi.fn();
const mockUseProjectRole = vi.fn();

vi.mock('../context/ProjectContext', () => ({
  useProject: () => mockUseProject(),
  useProjectRole: () => mockUseProjectRole(),
}));

describe('ProjectMembersPanel (Smoke Test Suite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar la lista de miembros y la sección de invitaciones cuando el usuario es Propietario', () => {
    mockUseProject.mockReturnValue({
      currentProject: mockCurrentProject,
      updateMemberRole: vi.fn(),
      removeMember: vi.fn(),
      createInviteLink: vi.fn(),
    });

    mockUseProjectRole.mockReturnValue({
      isOwner: true,
      isDistributor: false,
      isCollaborator: false,
      isGuest: false,
    });

    render(<ProjectMembersPanel />);

    // Verificar renderizado de miembros
    expect(screen.getByText('director@festis.app')).toBeInTheDocument();
    expect(screen.getByText('editor@festis.app')).toBeInTheDocument();
    expect(screen.getByText('Creador Original')).toBeInTheDocument();

    // Verificar panel de generación de invitaciones
    expect(screen.getByText('Generar Enlace de Invitación')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /generar y copiar enlace de invitación/i })
    ).toBeInTheDocument();
  });

  it('permite cambiar el rol a asignar en el selector de invitaciones', async () => {
    const user = userEvent.setup();

    mockUseProject.mockReturnValue({
      currentProject: mockCurrentProject,
      updateMemberRole: vi.fn(),
      removeMember: vi.fn(),
      createInviteLink: vi.fn(),
    });

    mockUseProjectRole.mockReturnValue({
      isOwner: true,
      isDistributor: false,
      isCollaborator: false,
      isGuest: false,
    });

    render(<ProjectMembersPanel />);

    const roleSelect = screen.getAllByRole('combobox')[0];
    expect(roleSelect).toBeInTheDocument();

    // Seleccionar rol Distribuidor
    await user.selectOptions(roleSelect, 'distribuidor');
    expect(roleSelect).toHaveValue('distribuidor');

    // Seleccionar rol Invitado
    await user.selectOptions(roleSelect, 'guest');
    expect(roleSelect).toHaveValue('guest');
  });

  it('oculta el generador de invitaciones cuando el usuario no es Propietario', () => {
    mockUseProject.mockReturnValue({
      currentProject: mockCurrentProject,
      updateMemberRole: vi.fn(),
      removeMember: vi.fn(),
      createInviteLink: vi.fn(),
    });

    mockUseProjectRole.mockReturnValue({
      isOwner: false,
      isDistributor: false,
      isCollaborator: true,
      isGuest: false,
    });

    render(<ProjectMembersPanel />);

    // Los miembros siguen visibles en modo lectura
    expect(screen.getByText('director@festis.app')).toBeInTheDocument();
    expect(screen.getByText('editor@festis.app')).toBeInTheDocument();

    // El generador de enlaces no se renderiza para colaboradores
    expect(screen.queryByText('Generar Enlace de Invitación')).not.toBeInTheDocument();
    expect(
      screen.getByText(/la generación de invitaciones y la asignación de roles están reservadas a los usuarios con rol/i)
    ).toBeInTheDocument();
  });
});
