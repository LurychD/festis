import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { isNewFestival } from '../utils/dateUtils';
import { BatchClipboardDetectionModal, BatchItemCandidate } from '../components/modals/BatchClipboardDetectionModal';
import { Festival, FestivalStatus } from '../types';
import { FestivalDetailsView } from '../components/FestivalDetailsView';
import { UpcomingDeadlinesList } from '../components/dashboard/UpcomingDeadlinesList';
import { PinnedFestivalsList } from '../components/dashboard/PinnedFestivalsList';
import { AutoClosedFestivalsList } from '../components/dashboard/AutoClosedFestivalsList';

// Mock del contexto de rol y proyecto
vi.mock('../context/ProjectContext', () => ({
  useProjectRole: () => ({
    role: 'owner',
    isOwner: true,
    isDistributor: true,
    isCollaborator: true,
    isGuest: false,
    canManageFestivals: true,
  }),
  useProject: () => ({
    currentProject: { id: 'proj-1', name: 'La Espera Silenciosa' },
  }),
}));

describe('Hotfix Quirúrgico: Portapapeles, Hold-to-Confirm y Badge Nuevo (QA Suite)', () => {
  describe('1. Helper isNewFestival (< 24 horas)', () => {
    it('debe retornar true si el festival fue creado hace menos de 24 horas', () => {
      const now = Date.now();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString();
      const twelveHoursAgo = new Date(now - 12 * 60 * 60 * 1000).toISOString();
      const twentyThreeHoursAgo = new Date(now - 23 * 60 * 60 * 1000).toISOString();

      expect(isNewFestival(fiveMinutesAgo)).toBe(true);
      expect(isNewFestival(twelveHoursAgo)).toBe(true);
      expect(isNewFestival(twentyThreeHoursAgo)).toBe(true);
    });

    it('debe retornar false si el festival tiene 24 horas o más de antigüedad', () => {
      const now = Date.now();
      const exact24HoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000).toISOString();
      const oneYearAgo = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString();

      expect(isNewFestival(exact24HoursAgo)).toBe(false);
      expect(isNewFestival(twoDaysAgo)).toBe(false);
      expect(isNewFestival(oneYearAgo)).toBe(false);
    });

    it('casos negativos: debe retornar false con gracia ante entradas nulas, vacías o corruptas', () => {
      expect(isNewFestival(undefined)).toBe(false);
      expect(isNewFestival('')).toBe(false);
      expect(isNewFestival('fecha-invalida')).toBe(false);
      expect(isNewFestival('NaN')).toBe(false);
    });
  });

  describe('2. BatchClipboardDetectionModal - Doble Tap y Lotes Unitarios (length === 1)', () => {
    const mockCandidates: BatchItemCandidate[] = [
      {
        id: 'c-1',
        name: 'Festival Internacional de Cine Fantástico de Catalunya - Sitges 2026',
        country: 'España',
        deadline: '2027-07-15',
        price: '35 USD',
        selectedForImport: true,
      },
    ];

    it('un solo tap alterna la selección para importación con gramática singular/plural', () => {
      const handleConfirm = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(
        <BatchClipboardDetectionModal
          isOpen={true}
          onClose={handleClose}
          candidates={mockCandidates}
          onConfirm={handleConfirm}
        />
      );

      // Verificamos que se renderiza el título largo con overflow horizontal
      const titleEl = screen.getByText(/Festival Internacional de Cine Fantástico/i);
      expect(titleEl).toBeInTheDocument();
      expect(titleEl.className).toContain('overflow-x-auto');

      // Botón inicial con 1 festival (gramática singular)
      expect(screen.getByText(/Importar 1 Festival \(Mantener 3s\)/i)).toBeInTheDocument();

      // Tap simple sobre la tarjeta: debe deseleccionar
      const cardContainer = titleEl.closest('.cursor-pointer');
      expect(cardContainer).not.toBeNull();

      fireEvent.click(cardContainer!);
      // El botón ahora debe indicar 0 festivales (plural)
      expect(screen.getByText(/Importar 0 Festivales \(Mantener 3s\)/i)).toBeInTheDocument();
    });

    it('un doble tap (< 320ms) activa el modo de edición inline', () => {
      const handleConfirm = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(
        <BatchClipboardDetectionModal
          isOpen={true}
          onClose={handleClose}
          candidates={mockCandidates}
          onConfirm={handleConfirm}
        />
      );

      const titleEl = screen.getByText(/Festival Internacional de Cine Fantástico/i);
      const cardContainer = titleEl.closest('.cursor-pointer')!;

      // Primer tap
      fireEvent.click(cardContainer);
      // Segundo tap inmediato (< 320ms)
      fireEvent.click(cardContainer);

      // Se debe haber abierto la sección de edición rápida inline
      expect(screen.getByText('Edición rápida inline')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Sitges 2026/i)).toBeInTheDocument();

      // Pulsar "Listo" cierra el modo edición inline
      const doneBtn = screen.getByText('Listo');
      fireEvent.click(doneBtn);
      expect(screen.queryByText('Edición rápida inline')).not.toBeInTheDocument();
    });
  });

  describe('3. Botón Hold-to-Confirm de 3 Segundos', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    const mockCandidates: BatchItemCandidate[] = [
      {
        id: 'c-1',
        name: 'Festival de Mar del Plata',
        country: 'Argentina',
        deadline: '2026-11-01',
        selectedForImport: true,
      },
    ];

    it('cancela la importación si se suelta el botón antes de los 3 segundos', () => {
      const handleConfirm = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(
        <BatchClipboardDetectionModal
          isOpen={true}
          onClose={handleClose}
          candidates={mockCandidates}
          onConfirm={handleConfirm}
        />
      );

      const confirmBtn = screen.getByTitle(/Mantén presionado durante 3 segundos/i);

      // Inicia hold
      fireEvent.mouseDown(confirmBtn);
      // Avanzar 1.5 segundos (50%)
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Soltar antes de 3s
      fireEvent.mouseUp(confirmBtn);

      // onConfirm NO debe haber sido llamado
      expect(handleConfirm).not.toHaveBeenCalled();
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('ejecuta la importación al cumplirse los 3 segundos continuos', async () => {
      const handleConfirm = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(
        <BatchClipboardDetectionModal
          isOpen={true}
          onClose={handleClose}
          candidates={mockCandidates}
          onConfirm={handleConfirm}
        />
      );

      const confirmBtn = screen.getByTitle(/Mantén presionado durante 3 segundos/i);

      // Inicia hold
      fireEvent.mouseDown(confirmBtn);

      // Avanzar los 3 segundos completos
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });

      expect(handleConfirm).toHaveBeenCalledTimes(1);
      const passedFestivals: Festival[] = handleConfirm.mock.calls[0][0];
      expect(passedFestivals.length).toBe(1);
      expect(passedFestivals[0].name).toBe('Festival de Mar del Plata');
      expect(passedFestivals[0].createdAt).toBeDefined();
    });
  });

  describe('4. No Duplicación del Badge "Nuevo" en FestivalDetailsView', () => {
    const mockFestival: Festival = {
      id: 'f-details-1',
      name: 'Festival de San Sebastián',
      country: 'España',
      type: 'Clase A',
      status: FestivalStatus.POR_ENVIAR,
      tasks: [],
      createdAt: new Date().toISOString(), // Creado hace segundos (< 24h)
    };

    it('debe existir exactamente una sola instancia del badge "Nuevo" en el DOM', () => {
      render(
        <FestivalDetailsView
          festival={mockFestival}
          isAuthorized={true}
          setView={vi.fn()}
          setModalType={vi.fn()}
          setIsModalOpen={vi.fn()}
          handleDeleteFestival={vi.fn()}
          setPromptConfig={vi.fn()}
          setConfirmConfig={vi.fn()}
          handleAddTask={vi.fn()}
          handleEditTask={vi.fn()}
          handleConfigTaskDeadline={vi.fn()}
          handleDeleteTask={vi.fn()}
          toggleTask={vi.fn()}
          handleUpdatePin={vi.fn()}
        />
      );

      // Validar que hay exactamente 1 badge "Nuevo" en todo el árbol de FestivalDetailsView
      const newBadges = screen.getAllByText('Nuevo');
      expect(newBadges.length).toBe(1);

      // Validar que dicho badge está ubicado dentro del bloque de encabezado del título h1
      const badgeElement = newBadges[0];
      expect(badgeElement).toBeInTheDocument();
      const h1El = screen.getByRole('heading', { level: 1, name: /Festival de San Sebastián/i });
      expect(h1El).toBeInTheDocument();
      expect(badgeElement.parentElement).toBe(h1El.parentElement);
    });
  });

  describe('5. Badge "Nuevo" en Listas del Dashboard', () => {
    const recentFestival: Festival = {
      id: 'f-dash-1',
      name: 'Rotterdam IFFR',
      country: 'Países Bajos',
      type: 'Festival',
      status: FestivalStatus.POR_ENVIAR,
      deadline: '2026-10-30',
      tasks: [],
      createdAt: new Date().toISOString(),
    };

    it('renderiza el badge "Nuevo" en UpcomingDeadlinesList', () => {
      render(
        <UpcomingDeadlinesList
          upcomingDeadlines={[recentFestival]}
          onSelectFestival={vi.fn()}
        />
      );
      expect(screen.getByText('Nuevo')).toBeInTheDocument();
      expect(screen.getByText('Rotterdam IFFR')).toBeInTheDocument();
    });

    it('renderiza el badge "Nuevo" en PinnedFestivalsList', () => {
      render(
        <PinnedFestivalsList
          pinnedFestivals={[recentFestival]}
          onSelectFestival={vi.fn()}
        />
      );
      expect(screen.getByText('Nuevo')).toBeInTheDocument();
      expect(screen.getByText('Rotterdam IFFR')).toBeInTheDocument();
    });

    it('renderiza el badge "Nuevo" en AutoClosedFestivalsList', () => {
      const closedRecent: Festival = {
        ...recentFestival,
        status: FestivalStatus.CERRADO,
      };
      render(
        <AutoClosedFestivalsList
          closedFestivals={[closedRecent]}
          onSelectFestival={vi.fn()}
        />
      );
      expect(screen.getByText('Nuevo')).toBeInTheDocument();
      expect(screen.getByText('Rotterdam IFFR')).toBeInTheDocument();
    });
  });
});
