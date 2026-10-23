import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  parseClipboardContent,
  clearClipboardMemoryCache,
  getCachedClipboardResult,
  setCachedClipboardResult,
  normalizeClipboardTextForCache,
} from '../utils/clipboardFestivalParser';
import {
  BatchClipboardDetectionModal,
  isCandidateExpiredOrClosed,
  isCandidateSelectedByDefault,
  BatchItemCandidate
} from '../components/modals/BatchClipboardDetectionModal';
import { ProjectProvider } from '../context/ProjectContext';

const renderWithContext = (ui: React.ReactElement) => {
  return render(
    <ProjectProvider>
      {ui}
    </ProjectProvider>
  );
};

describe('Sprint de Calidad y Estabilización - Suite QA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearClipboardMemoryCache();
    // Simular fallback local inmediato en tests unitarios para prevenir peticiones de red colgadas
    global.fetch = vi.fn().mockRejectedValue(new Error('Network disabled in unit test'));
  });

  afterEach(() => {
    clearClipboardMemoryCache();
    vi.useRealTimers();
  });

  describe('1. Sistema de Caché en Memoria Anti-Consumo de Cuota', () => {
    it('normaliza la clave de caché descartando variaciones de mayúsculas y espacios múltiples', () => {
      const key1 = normalizeClipboardTextForCache('  Festival de Cine   de Cannes   ', '2026-10-14');
      const key2 = normalizeClipboardTextForCache('festival de cine de cannes', '2026-10-14');
      expect(key1).toBe(key2);
    });

    it('almacena y recupera resultados en memoria sin llamadas externas adicionales', async () => {
      const sampleText = 'Convocatoria Festival Internacional de Mar del Plata 2026. Deadline: 2026-10-30. Cortometraje. Argentina.';

      // Primera ejecución: procesa y almacena en caché
      const res1 = await parseClipboardContent(sampleText, '2026-10-14');
      expect(res1.items.length).toBeGreaterThan(0);

      // Verificar que existe en caché
      const cached = getCachedClipboardResult(sampleText, '2026-10-14');
      expect(cached).not.toBeNull();
      expect(cached?.items.length).toBe(res1.items.length);
      expect(cached?.items[0].name).toBe(res1.items[0].name);

      // Segunda ejecución: devuelve resultado idéntico desde caché
      const res2 = await parseClipboardContent(sampleText, '2026-10-14');
      expect(res2.items[0].name).toBe(res1.items[0].name);
    });

    it('expira las entradas de caché al superar el TTL de 24 horas', () => {
      vi.useFakeTimers();
      const sampleText = 'Convocatoria Festival de Cine de Sitges 2026. Deadline: 2026-09-01. España.';
      const dummyResult = {
        items: [{ name: 'Sitges Film Festival', country: 'España' }],
        totalDetected: 1
      };

      setCachedClipboardResult(sampleText, dummyResult as any, '2026-10-14');

      // Antes de 24 horas está vigente
      expect(getCachedClipboardResult(sampleText, '2026-10-14')).not.toBeNull();

      // Avanzar el tiempo 24 horas y 1 segundo (86.401.000 ms)
      vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1000);

      // Debe haberse invalidado por expiración
      expect(getCachedClipboardResult(sampleText, '2026-10-14')).toBeNull();
    });

    it('devuelve array vacío ante texto sin relevancia cinematográfica (código, logs o basura)', async () => {
      const junkText = 'import React from "react"; export const Component = () => <div>Test</div>;';
      const res = await parseClipboardContent(junkText, '2026-10-14');
      expect(res.items.length).toBe(0);
      expect(res.totalDetected).toBe(0);
    });
  });

  describe('2. Detección y Tratamiento de Convocatorias Vencidas', () => {
    it('detecta como vencido un festival con deadline en el pasado', () => {
      const pastDeadlineFestival = {
        name: 'Festival de Cine Histórico',
        deadline: '2020-01-01',
      };
      expect(isCandidateExpiredOrClosed(pastDeadlineFestival)).toBe(true);
      expect(isCandidateSelectedByDefault(pastDeadlineFestival)).toBe(false);
    });

    it('detecta como vigente un festival con deadline en el futuro', () => {
      const futureDeadlineFestival = {
        name: 'Festival Futuro 2027',
        deadline: '2027-12-31',
      };
      expect(isCandidateExpiredOrClosed(futureDeadlineFestival)).toBe(false);
      expect(isCandidateSelectedByDefault(futureDeadlineFestival)).toBe(true);
    });

    it('detecta como vencido o descartado un festival con bandera isClosedOrDiscarded', () => {
      const closedFestival = {
        name: 'Muestra Cerrada',
        isClosedOrDiscarded: true,
        deadline: '2027-01-01',
      };
      expect(isCandidateExpiredOrClosed(closedFestival)).toBe(true);
      expect(isCandidateSelectedByDefault(closedFestival)).toBe(false);
    });

    it('renderiza badge [Convocatoria Vencida] y desmarca la tarjeta por defecto en BatchClipboardDetectionModal', () => {
      const candidates: BatchItemCandidate[] = [
        {
          id: 'f-expired',
          name: 'Festival del Pasado Vencido',
          country: 'Argentina',
          deadline: '2021-05-10',
          price: 'Gratis',
        },
        {
          id: 'f-valid',
          name: 'Festival Vigente 2027',
          country: 'Francia',
          deadline: '2027-10-10',
          price: 'Gratis',
        }
      ];

      renderWithContext(
        <BatchClipboardDetectionModal
          isOpen={true}
          onClose={vi.fn()}
          candidates={candidates}
          onConfirm={vi.fn()}
        />
      );

      // Debe renderizar la insignia Convocatoria Vencida
      const expiredBadges = screen.getAllByText('Convocatoria Vencida');
      expect(expiredBadges.length).toBeGreaterThanOrEqual(1);

      // El festival vigente debe estar presente
      expect(screen.getByText('Festival Vigente 2027')).toBeInTheDocument();
      expect(screen.getByText('Festival del Pasado Vencido')).toBeInTheDocument();
    });
  });

  describe('3. Edición del Enlace (Link) en Modo Inline', () => {
    it('muestra el campo de entrada URL editable al ingresar al modo inline por doble click o botón de edición', async () => {
      const candidates: BatchItemCandidate[] = [
        {
          id: 'f-link-test',
          name: 'Festival Internacional de Cine Animado',
          country: 'Canadá',
          deadline: '2027-06-30',
          price: '30 USD',
          link: 'https://annecyfestival.com',
        }
      ];

      renderWithContext(
        <BatchClipboardDetectionModal
          isOpen={true}
          onClose={vi.fn()}
          candidates={candidates}
          onConfirm={vi.fn()}
        />
      );

      // Activar edición mediante el botón icon-only de edición de la tarjeta
      const editBtn = screen.getByTitle(/Editar festival/i);
      fireEvent.click(editBtn);

      // Verificar que el input de enlace URL esté presente y sea editable
      const linkInput = screen.getByPlaceholderText(/Enlace o URL de postulación/i) as HTMLInputElement;
      expect(linkInput).toBeInTheDocument();
      expect(linkInput.value).toBe('https://annecyfestival.com');

      // Modificar el enlace
      fireEvent.change(linkInput, { target: { value: 'https://nuevo-enlace-festival.com' } });
      expect(linkInput.value).toBe('https://nuevo-enlace-festival.com');
    });
  });

  describe('4. Blindaje Anti-Falsos Positivos y Regla de Co-ocurrencia Audiovisual', () => {
    it('rechaza textos con lenguaje metafórico deportivo como "festival de goles de Boca"', async () => {
      const sportsText = 'Ayer hubo un festival de goles en el partido de Boca Juniors y River Plate en la Bombonera.';
      const res = await parseClipboardContent(sportsText, '2026-10-14');
      expect(res.items.length).toBe(0);
      expect(res.totalDetected).toBe(0);
    });

    it('rechaza festivales de música o gastronomía sin dominio audiovisual', async () => {
      const musicText = 'Festival de música rock y bandas en vivo el próximo fin de semana en el predio municipal.';
      const res = await parseClipboardContent(musicText, '2026-10-14');
      expect(res.items.length).toBe(0);
      expect(res.totalDetected).toBe(0);
    });

    it('acepta convocatorias legítimas con co-ocurrencia audiovisual', async () => {
      const validCall = 'Convocatoria abierta para cortometrajes en el Festival Internacional de Cine Independiente 2026. Bases y postulación abiertas.';
      const res = await parseClipboardContent(validCall, '2026-10-14');
      expect(res.items.length).toBeGreaterThan(0);
    });
  });

  describe('5. Deduplicación contra Pool Dual (Obra Activa + Caché de Copys del Día)', () => {
    it('identifica y alerta coincidencias contra copies analizados anteriormente hoy', () => {
      const candidates: BatchItemCandidate[] = [
        {
          id: 'cand-1',
          name: 'Festival de Cine de Valladolid',
          country: 'España',
          deadline: '2027-04-15',
          price: 'Gratis',
          deduplication: {
            isDuplicate: true,
            classification: 'DUPLICADO',
            origin: 'DAILY_CACHE',
            confidence: 0.95,
            matchedFestival: {
              id: 'prev-copy-1',
              name: 'Festival de Cine de Valladolid',
              country: 'España',
              type: 'Festival',
              status: 'Por enviar' as any,
              tasks: []
            }
          }
        }
      ];

      renderWithContext(
        <BatchClipboardDetectionModal
          isOpen={true}
          onClose={vi.fn()}
          candidates={candidates}
          onConfirm={vi.fn()}
        />
      );

      expect(screen.getByText(/¿Es la misma convocatoria\? Coincide con un texto analizado anteriormente hoy/i)).toBeInTheDocument();
    });
  });
});
