import Fuse from 'fuse.js';
import { Festival } from '../types';
import { extractPlatformSlug, lookupCanonicalFestival } from '../data/seed';

export type DeduplicationClassification = 'DUPLICADO' | 'NUEVA_EDICION' | 'UNICO';
export type DeduplicationOrigin = 'PROJECT_WORK' | 'DAILY_CACHE' | 'BATCH_INTERNAL';

export interface DeduplicationResult {
  isDuplicate: boolean;
  classification?: DeduplicationClassification;
  matchedFestival?: Festival;
  confidence: number; // 0.0 a 1.0
  layerMatched?: 1 | 2 | 3 | 4 | 5;
  reason?: string;
  origin?: DeduplicationOrigin;
  detectedEdition?: {
    candidateYear?: number;
    existingYear?: number;
    candidateEdition?: number;
    existingEdition?: number;
  };
}

export interface CandidateWithDeduplication extends Partial<Festival> {
  deduplication?: DeduplicationResult;
  isBatchDuplicate?: boolean;
}

const STOP_WORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'del', 'en', 'y', 'e', 'o', 'u', 'a',
  'international', 'film', 'festival', 'short', 'cortometrajes', 'cine',
  'internacional', 'edicion', 'edition', 'annual', 'anual', 'de', 'cinematografico',
  'fest', 'filmfest', 'festival', 'concurso', 'muestra'
]);

export function extractYearAndEdition(text: string): { year?: number; edition?: number } {
  if (!text) return {};

  const yearMatch = text.match(/\b(20\d\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

  const editionMatch = text.match(/\b(\d+)(?:th|st|nd|rd|º|ª|a|o|\.a|\.o)?\s*(?:edici[oó]n|edition|ed\.)\b/i);
  const edition = editionMatch ? parseInt(editionMatch[1], 10) : undefined;

  return { year, edition };
}

export function normalizeFestivalName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/\b20\d\d\b/g, '') // Quitar años ej. 2026, 2027
    .replace(/\b\d+(?:th|st|nd|rd|º|ª|a|o)?\b/gi, '') // Quitar números de edición ej. 41st, 15va
    .replace(/[^a-z0-9\s]/g, ' ') // Dejar solo caracteres alfanuméricos
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
    .join(' ')
    .trim();
}

export function tokenSortName(name: string): string {
  return normalizeFestivalName(name)
    .split(' ')
    .sort()
    .join(' ');
}

function extractUrlSlug(url?: string): string | null {
  if (!url) return null;
  const plat = extractPlatformSlug(url);
  if (plat) return `${plat.platform.toLowerCase()}:${plat.slug}`;
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase().replace(/\/$/, '');
    return `${parsed.hostname}${path}`;
  } catch {
    return null;
  }
}

/**
 * Evalúa si la coincidencia corresponde a una edición nueva legítima (diferente año o número de edición)
 * o a un duplicado destructivo exacto del mismo registro.
 */
function classifyDuplicateOrNewEdition(
  candYear?: number,
  exYear?: number,
  candEd?: number,
  exEd?: number
): { classification: DeduplicationClassification; reasonSuffix: string } {
  const isDifferentYear = candYear && exYear && candYear !== exYear;
  const isDifferentEd = candEd && exEd && candEd !== exEd;

  if (isDifferentYear || isDifferentEd) {
    const detail = isDifferentYear
      ? `Año candidato: ${candYear} vs Existente: ${exYear}`
      : `Edición candidata: ${candEd}ª vs Existente: ${exEd}ª`;
    return {
      classification: 'NUEVA_EDICION',
      reasonSuffix: ` [Detectada Nueva Edición: ${detail}]`
    };
  }

  return {
    classification: 'DUPLICADO',
    reasonSuffix: ''
  };
}

/**
 * Pipeline de deduplicación de 5 capas determinista de Festis / Cardigan.
 */
export function checkFestivalDuplicate(
  candidate: Partial<Festival>,
  existingFestivals: Festival[]
): DeduplicationResult {
  if (!candidate || !existingFestivals || existingFestivals.length === 0) {
    return { isDuplicate: false, classification: 'UNICO', confidence: 0 };
  }

  const candMeta = extractYearAndEdition(candidate.name || "");

  // Capa 1: URL y Platform Slug Match (FilmFreeway, Festhome, Shortfilmdepot, etc.)
  if (candidate.link) {
    const candidateSlug = extractUrlSlug(candidate.link);
    if (candidateSlug) {
      const urlMatch = existingFestivals.find((existing) => {
        if (!existing.link) return false;
        const existingSlug = extractUrlSlug(existing.link);
        return existingSlug && existingSlug === candidateSlug;
      });

      if (urlMatch) {
        const exMeta = extractYearAndEdition(urlMatch.name || "");
        const { classification, reasonSuffix } = classifyDuplicateOrNewEdition(
          candMeta.year,
          exMeta.year,
          candMeta.edition,
          exMeta.edition
        );

        return {
          isDuplicate: true,
          classification,
          matchedFestival: urlMatch,
          confidence: 1.0,
          layerMatched: 1,
          reason: `Coincidencia exacta de enlace de postulación (${candidate.link})${reasonSuffix}`,
          detectedEdition: {
            candidateYear: candMeta.year,
            existingYear: exMeta.year,
            candidateEdition: candMeta.edition,
            existingEdition: exMeta.edition
          }
        };
      }
    }
  }

  // Capa 2: Nombre Normalizado Idéntico sin stopwords
  const candNorm = normalizeFestivalName(candidate.name || "");
  if (candNorm && candNorm.length > 2) {
    const exactNameMatch = existingFestivals.find((existing) => {
      const exNorm = normalizeFestivalName(existing.name || "");
      return exNorm === candNorm;
    });

    if (exactNameMatch) {
      const exMeta = extractYearAndEdition(exactNameMatch.name || "");
      const { classification, reasonSuffix } = classifyDuplicateOrNewEdition(
        candMeta.year,
        exMeta.year,
        candMeta.edition,
        exMeta.edition
      );

      return {
        isDuplicate: true,
        classification,
        matchedFestival: exactNameMatch,
        confidence: 0.98,
        layerMatched: 2,
        reason: `Nombre idéntico detectado (${exactNameMatch.name})${reasonSuffix}`,
        detectedEdition: {
          candidateYear: candMeta.year,
          existingYear: exMeta.year,
          candidateEdition: candMeta.edition,
          existingEdition: exMeta.edition
        }
      };
    }
  }

  // Capa 3: Fuzzy Matching con Fuse.js
  if (candidate.name && candidate.name.length > 3) {
    const fuse = new Fuse(existingFestivals, {
      keys: ['name', 'link'],
      includeScore: true,
      threshold: 0.45,
      ignoreLocation: true,
      minMatchCharLength: 3
    });

    const results = fuse.search(candidate.name);
    if (results.length > 0 && results[0].score !== undefined && results[0].score <= 0.45) {
      const top = results[0];
      const conf = Math.max(0.80, 1 - (top.score || 0));
      const exMeta = extractYearAndEdition(top.item.name || "");
      const { classification, reasonSuffix } = classifyDuplicateOrNewEdition(
        candMeta.year,
        exMeta.year,
        candMeta.edition,
        exMeta.edition
      );

      return {
        isDuplicate: true,
        classification,
        matchedFestival: top.item,
        confidence: Number(conf.toFixed(2)),
        layerMatched: 3,
        reason: `Alta similitud difusa (${Math.round(conf * 100)}%) con "${top.item.name}"${reasonSuffix}`,
        detectedEdition: {
          candidateYear: candMeta.year,
          existingYear: exMeta.year,
          candidateEdition: candMeta.edition,
          existingEdition: exMeta.edition
        }
      };
    }
  }

  // Capa 4: Nombre Raíz + Token Sort + Ciudad / País coincidente
  if (candidate.name && (candidate.country || candidate.projectionLocation)) {
    const candGeo = (candidate.country || "").toLowerCase().trim();
    const candWords = candNorm.split(" ").filter((w) => w.length > 3);
    const candTokenSort = tokenSortName(candidate.name);

    const geoMatch = existingFestivals.find((ex) => {
      const exGeo = (ex.country || "").toLowerCase().trim();
      const exNorm = normalizeFestivalName(ex.name || "");
      const exTokenSort = tokenSortName(ex.name || "");
      const sameGeo = candGeo && exGeo && (candGeo.includes(exGeo) || exGeo.includes(candGeo));
      const hasSharedRootWord = candWords.some((w) => exNorm.includes(w));
      const hasTokenMatch = candTokenSort === exTokenSort;
      return (sameGeo && hasSharedRootWord) || (hasTokenMatch && sameGeo);
    });

    if (geoMatch) {
      const exMeta = extractYearAndEdition(geoMatch.name || "");
      const { classification, reasonSuffix } = classifyDuplicateOrNewEdition(
        candMeta.year,
        exMeta.year,
        candMeta.edition,
        exMeta.edition
      );

      return {
        isDuplicate: true,
        classification,
        matchedFestival: geoMatch,
        confidence: 0.88,
        layerMatched: 4,
        reason: `Misma ubicación (${candidate.country}) y raíz de nombre afín con "${geoMatch.name}"${reasonSuffix}`,
        detectedEdition: {
          candidateYear: candMeta.year,
          existingYear: exMeta.year,
          candidateEdition: candMeta.edition,
          existingEdition: exMeta.edition
        }
      };
    }
  }

  // Capa 5: Catálogo Semilla Canónica / Acrónimos compartidos
  const candCanonical = lookupCanonicalFestival(candidate.name || "");
  if (candCanonical) {
    const canonicalMatch = existingFestivals.find((ex) => {
      const exCanonical = lookupCanonicalFestival(ex.name);
      return exCanonical && exCanonical.id === candCanonical.id;
    });

    if (canonicalMatch) {
      const exMeta = extractYearAndEdition(canonicalMatch.name || "");
      const { classification, reasonSuffix } = classifyDuplicateOrNewEdition(
        candMeta.year,
        exMeta.year,
        candMeta.edition,
        exMeta.edition
      );

      return {
        isDuplicate: true,
        classification,
        matchedFestival: canonicalMatch,
        confidence: 0.95,
        layerMatched: 5,
        reason: `Ambos pertenecen al registro canónico "${candCanonical.name}"${reasonSuffix}`,
        detectedEdition: {
          candidateYear: candMeta.year,
          existingYear: exMeta.year,
          candidateEdition: candMeta.edition,
          existingEdition: exMeta.edition
        }
      };
    }
  }

  return {
    isDuplicate: false,
    classification: 'UNICO',
    confidence: 0
  };
}

/**
 * Deduplica un lote de candidatos contra la base de datos existente y previene
 * colisiones internas dentro del propio lote temporal.
 */
export function deduplicateBatch(
  candidates: Partial<Festival>[],
  existingFestivals: Festival[],
  dailyCachedFestivals: Partial<Festival>[] = []
): CandidateWithDeduplication[] {
  const result: CandidateWithDeduplication[] = [];
  const runningProjectPool: Festival[] = [...existingFestivals];
  const runningDailyPool: Festival[] = dailyCachedFestivals.map((d, idx) => ({
    id: d.id || `daily_cache_${idx}`,
    name: d.name || 'Festival diario',
    country: d.country || 'A confirmar',
    type: d.type || 'Festival',
    status: d.status || ('Por enviar' as any),
    deadline: d.deadline,
    link: d.link,
    tasks: []
  }));

  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];

    // 1. Cotejar primero contra Pool A: Festivales existentes en la Obra Activa de Firestore
    const dedupProject = checkFestivalDuplicate(cand, runningProjectPool);
    if (dedupProject.isDuplicate) {
      result.push({
        ...cand,
        deduplication: {
          ...dedupProject,
          origin: 'PROJECT_WORK',
          reason: `Ya en seguimiento: Coincide con festival existente (${dedupProject.matchedFestival?.name || 'obra'})`
        },
        isBatchDuplicate: dedupProject.matchedFestival?.id?.startsWith('temp_batch_')
      });
      continue;
    }

    // 2. Cotejar contra Pool B: Festivales analizados previamente en las últimas 24 horas
    const dedupDaily = checkFestivalDuplicate(cand, runningDailyPool);
    if (dedupDaily.isDuplicate) {
      result.push({
        ...cand,
        deduplication: {
          ...dedupDaily,
          origin: 'DAILY_CACHE',
          reason: `¿Es la misma convocatoria? Coincide con un texto analizado anteriormente hoy (${dedupDaily.matchedFestival?.name || 'copy previo'})`
        }
      });
      continue;
    }

    // 3. Candidato único en ambos pools
    result.push({
      ...cand,
      deduplication: { isDuplicate: false, classification: 'UNICO', confidence: 0 }
    });

    // Registrar en runningProjectPool para detectar duplicados internos dentro del mismo lote
    runningProjectPool.push({
      id: `temp_batch_${i}`,
      name: cand.name || `Candidato ${i + 1}`,
      country: cand.country || 'A confirmar',
      type: cand.type || 'Festival',
      status: cand.status || ('Por enviar' as any),
      link: cand.link,
      tasks: []
    });
  }

  return result;
}
