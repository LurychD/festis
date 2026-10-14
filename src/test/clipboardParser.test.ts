import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectFestivalFromText,
  detectMultipleFestivalsFromText,
  parseClipboardContent,
  stripHumanPreambleAndNoise,
  cleanTrailingConnectorsAndIncompleteWords,
  isLegitimateFestivalTitle,
  smartSegmentBatchText,
  isBatchText,
  extractFee,
  extractLocation,
  normalizeDateToISO
} from '../utils/clipboardFestivalParser';
import {
  checkFestivalDuplicate,
  deduplicateBatch,
  normalizeFestivalName
} from '../utils/clipboardDeduplicator';
import { Festival, FestivalStatus } from '../types';

describe('Suite de Benchmarks Oficial de Captura de Portapapeles y Deduplicación (Cardigan / Festis)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mockear fetch para forzar resolución offline en el motor determinista local
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.reject(new Error('Network offline - Fallback to deterministic local engine'))
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // BENCHMARK 1: FAN (Festival Audiovisual Neuquén)
  it('BENCHMARK 1: extrae festival canónico FAN en Neuquén, Argentina con sello INCAA', () => {
    const rawFAN = `
      Convocatoria abierta para el FAN 2026
      Festival Audiovisual Neuquén
      Fecha límite de inscripción: 15 de agosto de 2026
      Lugar: Neuquén, Patagonia Argentina
      Plataforma: https://fanfestival.com.ar/inscripcion
      Inscripción libre y gratuita. Auspiciado por el INCAA.
    `;

    const result = detectFestivalFromText(rawFAN);

    expect(result.name).toBe('Festival Audiovisual Neuquén');
    expect(result.country).toBe('Argentina');
    expect(result.deadline).toBe('2026-08-15');
    expect(result.price).toBe('Gratis');
    expect(result.fee).toBe(0);
    expect(result.detectedAccreditations).toContain('Auspicio INCAA');
  });

  // BENCHMARK 2: Animayo en mensaje informal de WhatsApp
  it('BENCHMARK 2: purga preámbulo y despedidas de WhatsApp, detecta Animayo en Las Palmas y sello Oscar', () => {
    const rawWhatsApp = `
      [14:32, 10/3/2026] Productor: Hola chicos, les comparto esta data!
      Fíjense este festival:
      Animayo 2026 - Festival Internacional de Animación
      Sede en Las Palmas de Gran Canaria
      Deadline: 2026-04-30
      Calificador a los Oscar para cortometraje internacional de animación.
      Abrazo grande a todos!
    `;

    const result = detectFestivalFromText(rawWhatsApp);

    expect(result.name).toBe('Festival Internacional de Animación, Efectos Visuales y Videojuegos Animayo');
    expect(result.country).toBe('España');
    expect(result.deadline).toBe('2026-04-30');
    expect(result.category).toBe('Animación');
    expect(result.detectedAccreditations).toContain('Oscar Qualifying');
  });

  // BENCHMARK 3: FICG en prosa narrativa
  it('BENCHMARK 3: extrae festival FICG desde prosa corrida y asigna Guadalajara, México', () => {
    const rawProse = `
      Les recuerdo que la postulación al Festival Internacional de Cine en Guadalajara
      para cortometrajes de ficción vence el 20 de enero de 2027 a través de https://ficg.mx/convocatorias.
      Tasa de inscripción 25 USD.
    `;

    const result = detectFestivalFromText(rawProse);

    expect(result.name).toBe('Festival Internacional de Cine en Guadalajara');
    expect(result.country).toBe('México');
    expect(result.deadline).toBe('2027-01-20');
    expect(result.price).toBe('$25 USD');
    expect(result.fee).toBe(25);
    expect(result.category).toBe('Cortometraje');
  });

  // BENCHMARK 4: Lote de festivales múltiples (Ajayu, Villa Elisa, Amazónico)
  it('BENCHMARK 4: segmenta y parsea lote de festivales latinoamericanos independientes', () => {
    const rawBatch = `
      1. Festival Internacional de Animación Ajayu
      Deadline: 30 de septiembre de 2026
      Sede: Puno, Perú
      https://ajayufestival.com

      2. Festival de Cine de Villa Elisa
      Cierre de convocatoria: 15 de octubre de 2026
      Entre Ríos, Argentina
      Gratuito para cortometrajes

      3. Festival Internacional de Cine Amazónico
      Fecha límite: 2026-11-20
      Iquitos
      https://cineamazonico.org
    `;

    const items = detectMultipleFestivalsFromText(rawBatch);

    expect(items.length).toBe(3);
    expect(items[0].name).toBe('Festival Internacional de Animación Ajayu');
    expect(items[0].country).toBe('Perú');
    expect(items[0].deadline).toBe('2026-09-30');

    expect(items[1].name).toBe('Festival de Cine de Villa Elisa');
    expect(items[1].country).toBe('Argentina');
    expect(items[1].deadline).toBe('2026-10-15');
    expect(items[1].price).toBe('Gratis');

    expect(items[2].name).toBe('Festival Internacional de Cine Amazónico');
    expect(items[2].country).toBe('Perú');
    expect(items[2].deadline).toBe('2026-11-20');
  });

  // BENCHMARK 5: Aislamiento hermético de sellos/tags por bloque en lotes
  it('BENCHMARK 5: garantiza aislamiento hermético de acreditaciones (Oscar no contamina al siguiente)', () => {
    const rawBatchWithTags = `
      Sitges - Festival Internacional de Cinema Fantàstic
      Deadline: 2026-07-15
      Calificador a los Oscar y a los Premios Goya.
      https://sitgesfilmfestival.com

      Festival de Cine Cuenca del Salado
      Deadline: 2026-08-30
      Sede Rauch, Argentina
      Inscripción libre.
    `;

    const items = detectMultipleFestivalsFromText(rawBatchWithTags);

    expect(items.length).toBe(2);
    // Bloque 1 tiene sellos Oscar y Goya
    expect(items[0].detectedAccreditations).toContain('Oscar Qualifying');
    expect(items[0].detectedAccreditations).toContain('Calificador a los Goya');

    // Bloque 2 NO debe tener sellos Oscar ni Goya
    expect(items[1].detectedAccreditations).not.toContain('Oscar Qualifying');
    expect(items[1].detectedAccreditations).not.toContain('Calificador a los Goya');
  });

  // BENCHMARK 6: Cuenca del Salado con fee explícito de 12 USD
  it('BENCHMARK 6: extrae arancel numérico exacto de 12 USD y formatea precio', () => {
    const rawCuenca = `
      Festival de Cine Cuenca del Salado 2026
      Sede en Rauch
      Fee de postulación: 12 USD por obra
      Deadline: 2026-09-10
    `;

    const result = detectFestivalFromText(rawCuenca);

    expect(result.name).toBe('Festival de Cine Cuenca del Salado');
    expect(result.country).toBe('Argentina');
    expect(result.price).toBe('$12 USD');
    expect(result.fee).toBe(12);
  });

  // BENCHMARK 7: Descarte de falsos lotes en festivales extensos
  it('BENCHMARK 7: no fragmenta un festival individual extenso con múltiples párrafos', () => {
    const lengthyFestival = `
      Sitges - Festival Internacional de Cinema Fantàstic de Catalunya 2026

      El Festival de Sitges abre su periodo de inscripciones para largometrajes y cortometrajes.
      Las obras seleccionadas formarán parte de la Sección Oficial Fantàstic a Competición.

      Requisitos técnicos:
      Se aceptan copias en DCP y subtitulado en inglés o castellano. La duración máxima es de 30 minutos.

      Fecha límite: 15 de julio de 2026.
      Plataforma oficial: https://festhome.com/festival/sitges
    `;

    expect(isBatchText(lengthyFestival)).toBe(false);

    const items = detectMultipleFestivalsFromText(lengthyFestival);
    expect(items.length).toBe(1);
    expect(items[0].name).toBe('Sitges - Festival Internacional de Cinema Fantàstic de Catalunya');
    expect(items[0].country).toBe('España');
    expect(items[0].deadline).toBe('2026-07-15');
  });

  // BENCHMARK 8: Saneamiento anti-Frankenstein y conectores truncados
  it('BENCHMARK 8: purga preposiciones huérfanas al final de títulos y valida legitimidad', () => {
    expect(cleanTrailingConnectorsAndIncompleteWords('Festival Internacional de')).toBe('Festival Internacional');
    expect(cleanTrailingConnectorsAndIncompleteWords('Muestra de Cine del')).toBe('Muestra de Cine');
    expect(cleanTrailingConnectorsAndIncompleteWords('Concurso Gu')).toBe('Concurso');

    expect(isLegitimateFestivalTitle('Festival de Cortos de Huesca')).toBe(true);
    expect(isLegitimateFestivalTitle('Zinemaldia')).toBe(true);
    expect(isLegitimateFestivalTitle('hola si querés mandar tu corto')).toBe(false);
  });

  // BENCHMARK 9: Deduplicación Capa 1 por URL y Platform Slug
  it('BENCHMARK 9: detecta duplicado en Capa 1 mediante coincidencia de Slug de FilmFreeway', () => {
    const existingPool: Festival[] = [
      {
        id: 'fest_ff_1',
        name: 'Sundance Film Festival',
        country: 'Estados Unidos',
        type: 'Festival🎬',
        status: FestivalStatus.POR_ENVIAR,
        link: 'https://filmfreeway.com/Sundance',
        tasks: []
      }
    ];

    const candidate: Partial<Festival> = {
      name: 'Sundance Fest Convocatoria',
      link: 'https://filmfreeway.com/Sundance/'
    };

    const dedup = checkFestivalDuplicate(candidate, existingPool);
    expect(dedup.isDuplicate).toBe(true);
    expect(dedup.layerMatched).toBe(1);
    expect(dedup.confidence).toBe(1.0);
  });

  // BENCHMARK 10: Deduplicación Capa 2 por nombre normalizado sin stopwords
  it('BENCHMARK 10: detecta duplicado en Capa 2 por nombre normalizado idéntico', () => {
    const existingPool: Festival[] = [
      {
        id: 'fest_mdp',
        name: 'Festival Internacional de Cine de Mar del Plata',
        country: 'Argentina',
        type: 'Festival🎬',
        status: FestivalStatus.POR_ENVIAR,
        tasks: []
      }
    ];

    const candidate: Partial<Festival> = {
      name: 'Festival Internacional de Cine de Mar del Plata'
    };

    const dedup = checkFestivalDuplicate(candidate, existingPool);
    expect(dedup.isDuplicate).toBe(true);
    expect(dedup.layerMatched).toBe(2);
    expect(dedup.confidence).toBe(0.98);
  });

  // BENCHMARK 11: Discriminación explícita DUPLICADO vs NUEVA_EDICION
  it('BENCHMARK 11: discrimina explícitamente entre DUPLICADO exacto y NUEVA_EDICION según año', () => {
    const existingPool: Festival[] = [
      {
        id: 'fest_sitges_2026',
        name: 'Sitges Film Festival 2026',
        country: 'España',
        type: 'Festival🎬',
        status: FestivalStatus.POR_ENVIAR,
        tasks: []
      }
    ];

    // Mismo año -> DUPLICADO
    const dupCandidate: Partial<Festival> = {
      name: 'Sitges Film Festival 2026'
    };
    const resDup = checkFestivalDuplicate(dupCandidate, existingPool);
    expect(resDup.isDuplicate).toBe(true);
    expect(resDup.classification).toBe('DUPLICADO');

    // Año siguiente -> NUEVA_EDICION
    const newEdCandidate: Partial<Festival> = {
      name: 'Sitges Film Festival 2027'
    };
    const resNewEd = checkFestivalDuplicate(newEdCandidate, existingPool);
    expect(resNewEd.isDuplicate).toBe(true);
    expect(resNewEd.classification).toBe('NUEVA_EDICION');
    expect(resNewEd.detectedEdition?.candidateYear).toBe(2027);
    expect(resNewEd.detectedEdition?.existingYear).toBe(2026);
  });

  // BENCHMARK 12: Motor local determinista resuelve 100% de casos offline con parseClipboardContent
  it('BENCHMARK 12: parseClipboardContent resuelve con éxito local determinista ante caída de red', async () => {
    const offlineClipboard = `
      Festival Internacional de Cine de Huesca 2027
      Deadline: 15 de febrero de 2027
      https://www.huesca-filmfestival.com
      Calificador a los Premios Goya.
    `;

    const result = await parseClipboardContent(offlineClipboard);

    expect(result.items.length).toBe(1);
    expect(result.totalDetected).toBe(1);

    const fest = result.items[0];
    expect(fest.name).toBe('Festival Internacional de Cine de Huesca');
    expect(fest.country).toBe('España');
    expect(fest.deadline).toBe('2027-02-15');
    expect(fest.detectedAccreditations).toContain('Calificador a los Goya');
  });
});
