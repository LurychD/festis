import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  extractMeaningfulTokens,
  findMatchingTokens,
  highlightMatchingTokens,
  renderHighlightedText
} from '../utils/textHighlightUtils';
import { DuplicateComparisonView } from '../components/modals/DuplicateComparisonView';
import {
  BatchClipboardDetectionModal,
  BatchItemCandidate
} from '../components/modals/BatchClipboardDetectionModal';
import { FestivalListView } from '../components/FestivalListView';
import { Festival, FestivalStatus } from '../types';
import { ProjectProvider } from '../context/ProjectContext';

const renderWithContext = (ui: React.ReactElement) => {
  return render(<ProjectProvider>{ui}</ProjectProvider>);
};

describe('Sprint de Comparativa Interactiva y Pulido Ergonómico', () => {
  describe('1. Motor de Resaltado Léxico Determinista (textHighlightUtils)', () => {
    it('extrae tokens significativos descartando stopwords y signos de puntuación', () => {
      const tokens = extractMeaningfulTokens('Festival Internacional de Cine y Cortometrajes en Sitges!');
      expect(tokens).toContain('internacional');
      expect(tokens).toContain('cine');
      expect(tokens).toContain('cortometrajes');
      expect(tokens).toContain('sitges');
      expect(tokens).not.toContain('de');
      expect(tokens).not.toContain('y');
      expect(tokens).not.toContain('en');
    });

    it('identifica tokens coincidentes entre dos textos distintos', () => {
      const textA = 'Festival Internacional de Cine Fantástico de Sitges 2026';
      const textB = 'Sitges Film Festival Cine Fantástico';
      const matches = findMatchingTokens(textA, textB);

      expect(matches.has('sitges')).toBe(true);
      expect(matches.has('cine')).toBe(true);
      expect(matches.has('fantastico')).toBe(true);
    });

    it('envuelve tokens coincidentes en etiquetas <mark> con estilo visual amber', () => {
      const textA = 'Festival de Sitges 2026';
      const textB = 'Sitges Convocatoria';
      const result = highlightMatchingTokens(textA, textB);

      const rendered = render(<div>{result.highlightedA}</div>);
      const mark = rendered.container.querySelector('mark');
      expect(mark).not.toBeNull();
      expect(mark?.textContent).toBe('Sitges');
      expect(mark?.className).toBe('bg-amber-200 text-amber-900 font-bold px-1 rounded');
    });

    it('es inmune a caracteres especiales de Regex y textos vacíos o corruptos', () => {
      const textWithRegexSpecials = 'Festival [Cine] (Cortos) + Animación * $100? ^Fin {2026}';
      const textB = 'Festival [Cine] (Cortos)';

      // No debe lanzar SyntaxError ni excepciones no controladas
      expect(() => highlightMatchingTokens(textWithRegexSpecials, textB)).not.toThrow();
      expect(() => highlightMatchingTokens('', '')).not.toThrow();
      expect(() => highlightMatchingTokens(null as any, undefined as any)).not.toThrow();

      const result = highlightMatchingTokens(textWithRegexSpecials, textB);
      expect(result.matchingCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Componente Side-by-Side (DuplicateComparisonView)', () => {
    const mockCandidate: BatchItemCandidate = {
      id: 'cand-annecy-new',
      name: 'Festival Internacional de Animación Annecy 2026',
      country: 'Francia',
      deadline: '2026-03-15',
      price: '35 EUR',
      link: 'https://www.annecyfestival.com/submissions',
      category: 'Animación',
      deduplication: {
        isDuplicate: true,
        classification: 'DUPLICADO',
        origin: 'PROJECT_WORK',
        confidence: 0.95,
        reason: 'Coincidencia de plataforma y título',
        layerMatched: 2,
        matchedFestival: {
          id: 'fest-annecy-existing',
          name: 'Annecy Animation Festival',
          country: 'Francia',
          deadline: '2025-03-15',
          price: '30 EUR',
          link: 'https://www.annecyfestival.com',
          status: FestivalStatus.POR_ENVIAR,
          type: 'Festival',
          tasks: [],
          observations: 'Edición anterior enviada'
        }
      }
    };

    it('renderiza dos columnas con el candidato nuevo y el registro existente', () => {
      render(
        <DuplicateComparisonView
          isOpen={true}
          onClose={vi.fn()}
          candidate={mockCandidate}
          candidateIndex={0}
          onDiscardNew={vi.fn()}
          onUpdateExisting={vi.fn()}
          onKeepBoth={vi.fn()}
        />
      );

      expect(screen.getByText(/Comparativa de Convocatoria/i)).toBeInTheDocument();
      expect(screen.getByText(/Candidato Nuevo \(Portapapeles\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Registro en Obra/i)).toBeInTheDocument();
      expect(screen.getAllByText('Francia').length).toBeGreaterThanOrEqual(1);
    });

    it('ejecuta la acción [Descartar nuevo] con touch target adecuado', () => {
      const onDiscard = vi.fn();
      render(
        <DuplicateComparisonView
          isOpen={true}
          onClose={vi.fn()}
          candidate={mockCandidate}
          candidateIndex={0}
          onDiscardNew={onDiscard}
          onUpdateExisting={vi.fn()}
          onKeepBoth={vi.fn()}
        />
      );

      const discardBtn = screen.getByText(/Descartar nuevo/i).closest('button');
      expect(discardBtn).not.toBeNull();
      fireEvent.click(discardBtn!);
      expect(onDiscard).toHaveBeenCalledWith(0);
    });

    it('ejecuta la acción [Conservar ambos] marcando el festival como independiente', () => {
      const onKeepBoth = vi.fn();
      render(
        <DuplicateComparisonView
          isOpen={true}
          onClose={vi.fn()}
          candidate={mockCandidate}
          candidateIndex={0}
          onDiscardNew={vi.fn()}
          onUpdateExisting={vi.fn()}
          onKeepBoth={onKeepBoth}
        />
      );

      const keepBothBtn = screen.getByText(/Conservar ambos/i).closest('button');
      expect(keepBothBtn).not.toBeNull();
      fireEvent.click(keepBothBtn!);
      expect(onKeepBoth).toHaveBeenCalledWith(0);
    });

    it('ejecuta la acción [Actualizar existente] pasando el ID del festival preexistente', () => {
      const onUpdateExisting = vi.fn();
      render(
        <DuplicateComparisonView
          isOpen={true}
          onClose={vi.fn()}
          candidate={mockCandidate}
          candidateIndex={0}
          onDiscardNew={vi.fn()}
          onUpdateExisting={onUpdateExisting}
          onKeepBoth={vi.fn()}
          canEdit={true}
        />
      );

      const updateBtn = screen.getByText(/Actualizar existente/i).closest('button');
      expect(updateBtn).not.toBeNull();
      fireEvent.click(updateBtn!);
      expect(onUpdateExisting).toHaveBeenCalledWith(0, 'fest-annecy-existing');
    });
  });

  describe('3. Modal de Detección de Lote (BatchClipboardDetectionModal sin truncate)', () => {
    it('elimina truncate y expone botón interactivo [Ver Comparativa] en banners de similitud', () => {
      const duplicateCandidate: BatchItemCandidate = {
        id: 'dup-1',
        name: 'Festival Internacional de Cine Documental Extraordinariamente Largo para Prueba de No Truncamiento',
        country: 'España',
        deadline: '2026-11-20',
        price: 'Gratis',
        deduplication: {
          isDuplicate: true,
          classification: 'DUPLICADO',
          origin: 'DAILY_CACHE',
          confidence: 0.95,
          reason: 'Coincide con texto analizado anteriormente hoy',
          matchedFestival: {
            id: 'cached-1',
            name: 'Festival Internacional de Cine Documental',
            country: 'España',
            type: 'Festival',
            status: FestivalStatus.POR_ENVIAR,
            tasks: []
          }
        }
      };

      const { container } = renderWithContext(
        <BatchClipboardDetectionModal
          isOpen={true}
          onClose={vi.fn()}
          candidates={[duplicateCandidate]}
          onConfirm={vi.fn()}
        />
      );

      // Comprobar que el banner de advertencia no tiene la clase truncate
      const similarityBanner = screen.getByText(/¿Es la misma convocatoria\?/i);
      expect(similarityBanner.className).toContain('break-words');
      expect(similarityBanner.className).not.toContain('truncate');

      // Comprobar que existe el botón interactivo Ver Comparativa
      const compareBtn = screen.getByRole('button', { name: /Ver Comparativa/i });
      expect(compareBtn).toBeInTheDocument();

      // Al hacer clic, debe abrir el visor Side-by-Side
      fireEvent.click(compareBtn);
      expect(screen.getByText(/Comparativa de Convocatoria/i)).toBeInTheDocument();
    });
  });

  describe('4. Contorno Animado en FestivalListView', () => {
    it('aplica border-emerald-300 ring-2 ring-emerald-400/30 animate-pulse en festivales nuevos', () => {
      const nowIso = new Date().toISOString();
      const mockFestivals: Festival[] = [
        {
          id: 'fest-new-1',
          name: 'Festival Recién Importado',
          country: 'Argentina',
          deadline: '2026-12-01',
          status: FestivalStatus.POR_ENVIAR,
          type: 'Festival',
          createdAt: nowIso,
          tasks: []
        },
        {
          id: 'fest-old-1',
          name: 'Festival Histórico Antiguo',
          country: 'Francia',
          deadline: '2025-01-01',
          status: FestivalStatus.POR_ENVIAR,
          type: 'Festival',
          createdAt: '2024-01-01T00:00:00Z',
          tasks: []
        }
      ];

      renderWithContext(
        <FestivalListView
          festivals={mockFestivals}
          filteredFestivals={mockFestivals}
          setFestivals={vi.fn()}
          setSelectedFestival={vi.fn()}
          setView={vi.fn()}
          filterStatus="all"
          setFilterStatus={vi.fn()}
          dateFilter="all"
          setDateFilter={vi.fn()}
          displayedCount={20}
          setDisplayedCount={vi.fn()}
          search=""
          searchInObs={false}
        />
      );

      // El festival nuevo debe tener el badge [Nuevo]
      expect(screen.getByText('Nuevo')).toBeInTheDocument();

      // La tarjeta del festival nuevo debe tener la clase de contorno animado esmeralda
      const newCardHeading = screen.getByText('Festival Recién Importado');
      const newCard = newCardHeading.closest('.cursor-pointer');
      expect(newCard?.className).toContain('border-emerald-300');
      expect(newCard?.className).toContain('ring-emerald-400/30');
      expect(newCard?.className).toContain('animate-pulse');

      // La tarjeta antigua no debe tener animate-pulse
      const oldCardHeading = screen.getByText('Festival Histórico Antiguo');
      const oldCard = oldCardHeading.closest('.cursor-pointer');
      expect(oldCard?.className).not.toContain('animate-pulse');
      expect(oldCard?.className).not.toContain('ring-emerald-400/30');
    });
  });
});
