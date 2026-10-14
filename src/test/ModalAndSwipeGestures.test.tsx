import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { useDrawerSwipeGesture } from '../hooks/useDrawerSwipeGesture';
import { ProjectModal } from '../components/ProjectModal';
import { ReminderModal } from '../components/ReminderModal';
import { CountdownModal } from '../components/CountdownModal';

describe('useDrawerSwipeGesture (Directiva de Ergonomía Móvil)', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 844 });
  });

  it('no abre el drawer si el toque inicial ocurre en la mitad superior de la pantalla', () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    renderHook(() => useDrawerSwipeGesture({ isOpen: false, onOpen, onClose }));

    // Mitad superior: clientY = 200 (altura total 844, mitad = 422)
    fireEvent.touchStart(window, {
      touches: [{ clientX: 380, clientY: 200 }],
    });

    fireEvent.touchEnd(window, {
      changedTouches: [{ clientX: 280, clientY: 200 }],
    });

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('no abre el drawer si el toque no ocurre en proximidad al margen derecho', () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    renderHook(() => useDrawerSwipeGesture({ isOpen: false, onOpen, onClose }));

    // Mitad inferior pero centro de pantalla: clientX = 150
    fireEvent.touchStart(window, {
      touches: [{ clientX: 150, clientY: 600 }],
    });

    fireEvent.touchEnd(window, {
      changedTouches: [{ clientX: 80, clientY: 600 }],
    });

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('no abre el drawer si el movimiento es predominantemente vertical (scroll)', () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    renderHook(() => useDrawerSwipeGesture({ isOpen: false, onOpen, onClose }));

    // Toque en borde derecho y mitad inferior, pero arrastre vertical hacia arriba
    fireEvent.touchStart(window, {
      touches: [{ clientX: 370, clientY: 600 }],
    });

    fireEvent.touchEnd(window, {
      changedTouches: [{ clientX: 310, clientY: 450 }], // deltaX: -60, deltaY: -150
    });

    expect(onOpen).not.toHaveBeenCalled();
  });

  it('dispara onOpen con swipe horizontal válido desde borde derecho en mitad inferior', () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    renderHook(() => useDrawerSwipeGesture({ isOpen: false, onOpen, onClose }));

    // Toque en borde derecho (375 > 390 - 65) y mitad inferior (600 > 422)
    fireEvent.touchStart(window, {
      touches: [{ clientX: 375, clientY: 600 }],
    });

    // Deslizamiento hacia la izquierda claro (deltaX = -75, deltaY = 5)
    fireEvent.touchEnd(window, {
      changedTouches: [{ clientX: 300, clientY: 605 }],
    });

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('dispara onClose cuando el drawer está abierto y se realiza un swipe hacia la derecha', () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    renderHook(() => useDrawerSwipeGesture({ isOpen: true, onOpen, onClose }));

    fireEvent.touchStart(window, {
      touches: [{ clientX: 150, clientY: 500 }],
    });

    // Deslizamiento hacia la derecha (deltaX = +60, deltaY = 0)
    fireEvent.touchEnd(window, {
      changedTouches: [{ clientX: 210, clientY: 500 }],
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Modales y Transiciones con Framer Motion', () => {
  it('ProjectModal: se renderiza abierto, responde a botón cancelar y omite textos de relleno', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSubmit = vi.fn();

    render(
      <ProjectModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    );

    // Título limpio
    expect(screen.getByText('Nueva Obra Audiovisual')).toBeInTheDocument();
    // Botón cancelar
    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    expect(cancelBtn).toBeInTheDocument();
    await user.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('ReminderModal: se renderiza y permite cancelar limpiamente', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSave = vi.fn();

    render(
      <ReminderModal
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        festivals={[]}
      />
    );

    expect(screen.getByText('Nuevo Recordatorio')).toBeInTheDocument();
    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('CountdownModal: se renderiza correctamente con título y botón de cierre', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <CountdownModal
        isOpen={true}
        onClose={handleClose}
        targetDate="2026-12-31T00:00:00Z"
        planName="Plan Internacional 2026"
      />
    );

    expect(screen.getByText('Plazo de Resolución')).toBeInTheDocument();
    expect(screen.getByText('Plan Internacional 2026')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /cerrar/i });
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
