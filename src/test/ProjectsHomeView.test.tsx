import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { ProjectsHomeView } from '../components/ProjectsHomeView';

// Mock de Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn((_ref, callback) => {
    callback({ size: 4 });
    return vi.fn();
  }),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

// Mock del contexto de autenticación
const mockUser = {
  uid: 'user_director_1',
  email: 'axeldibarra@gmail.com',
  displayName: 'Axel Ibarra',
};

const mockLogout = vi.fn();

vi.mock('../AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    loading: false,
    authError: null,
  }),
}));

// Mock del contexto de proyecto
const mockProjects = [
  {
    id: 'proj_la_espera',
    name: 'La Espera Silenciosa',
    fps: 24,
    resolution: '4K',
    iconUrl: 'https://festis.app/poster1.webp',
    createdBy: 'Axel Ibarra',
    tags: ['Ficción', 'Drama'],
  },
  {
    id: 'proj_el_eco',
    name: 'El Eco del Viento',
    fps: 30,
    resolution: '1080p',
    iconUrl: '',
    createdBy: 'Lucia Ruocco',
    tags: ['Documental'],
  },
];

const mockSetCurrentProject = vi.fn();
const mockCreateProject = vi.fn();

vi.mock('../context/ProjectContext', () => ({
  useProject: () => ({
    projects: mockProjects,
    isLoadingProjects: false,
    setCurrentProject: mockSetCurrentProject,
    createProject: mockCreateProject,
  }),
}));

describe('ProjectsHomeView (Suite de Pruebas Automatizadas)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el encabezado flotante con la marca Festis y el campo de búsqueda', () => {
    render(<ProjectsHomeView onOpenConfig={vi.fn()} onOpenHelp={vi.fn()} />);

    // Verificar identidad en el header flotante
    expect(screen.getByText('Festis')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/buscar obra, formato o etiquetas\.\.\./i)
    ).toBeInTheDocument();
  });

  it('debe renderizar las obras en formato cinematográfico con afiche 1/3 y badges técnicos', () => {
    render(<ProjectsHomeView onOpenConfig={vi.fn()} onOpenHelp={vi.fn()} />);

    // Verificar títulos de las obras
    expect(screen.getByText('La Espera Silenciosa')).toBeInTheDocument();
    expect(screen.getByText('El Eco del Viento')).toBeInTheDocument();

    // Badges técnicos
    expect(screen.getByText('24 FPS')).toBeInTheDocument();
    expect(screen.getByText('4K')).toBeInTheDocument();
    expect(screen.getByText('30 FPS')).toBeInTheDocument();
    expect(screen.getByText('1080p')).toBeInTheDocument();

    // Creador
    expect(screen.getByText('Axel Ibarra')).toBeInTheDocument();

    // Contador de festivales (mockeado en 4)
    expect(screen.getAllByText(/4/i)[0]).toBeInTheDocument();
  });

  it('permite abrir el drawer lateral y visualizar el usuario activo, estado y opciones', async () => {
    const user = userEvent.setup();
    const mockOpenConfig = vi.fn();
    const mockOpenHelp = vi.fn();

    render(
      <ProjectsHomeView
        onOpenConfig={mockOpenConfig}
        onOpenHelp={mockOpenHelp}
      />
    );

    // Botón de menú hamburguesa
    const menuBtn = screen.getByTitle(/abrir menú/i);
    expect(menuBtn).toBeInTheDocument();
    await user.click(menuBtn);

    // En el drawer se muestra el email y el badge de acceso
    expect(screen.getByText('axeldibarra@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('Acceso Autorizado')).toBeInTheDocument();

    // Botón de Configuración de la App
    const configBtn = screen.getByRole('button', {
      name: /configuración de la app/i,
    });
    expect(configBtn).toBeInTheDocument();
    await user.click(configBtn);
    expect(mockOpenConfig).toHaveBeenCalledTimes(1);
  });

  it('permite filtrar reactivamente las obras por nombre en el buscador', async () => {
    const user = userEvent.setup();

    render(<ProjectsHomeView onOpenConfig={vi.fn()} onOpenHelp={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/buscar obra, formato o etiquetas\.\.\./i);

    // Escribir "Silenciosa"
    await user.type(searchInput, 'Silenciosa');

    // "La Espera Silenciosa" debe estar visible
    expect(screen.getByText('La Espera Silenciosa')).toBeInTheDocument();

    // "El Eco del Viento" debe ocultarse por el filtro
    expect(screen.queryByText('El Eco del Viento')).not.toBeInTheDocument();
  });
});
