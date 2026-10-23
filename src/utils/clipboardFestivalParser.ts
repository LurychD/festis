import * as chrono from 'chrono-node';
import * as linkify from 'linkifyjs';
import currency from 'currency.js';
import nlp from 'compromise';
import countries from 'i18n-iso-countries';
import esCountriesLocale from 'i18n-iso-countries/langs/es.json';
import enCountriesLocale from 'i18n-iso-countries/langs/en.json';
import { Festival, FestivalStatus } from '../types';
import {
  lookupCountryByCity,
  extractPlatformSlug,
  detectAccreditations,
  isDiscardedOrClosed,
  matchSeedFestival,
  AUDIVISUAL_GEOGRAPHY_SEED,
  CANONICAL_FESTIVALS_SEED
} from '../data/seed';

// Inicializar catálogos de países ISO
try {
  countries.registerLocale(esCountriesLocale);
  countries.registerLocale(enCountriesLocale);
} catch {
  // Manejo seguro si ya fueron registrados
}

export interface ExtractedFestivalCandidate extends Partial<Festival> {
  rawSnippet?: string;
  rawNotes?: string;
  detectedAccreditations?: string[];
  extractionConfidence?: number;
  detectedCity?: string;
  city?: string;
  isClosedOrDiscarded?: boolean;
}

/**
 * Purga preámbulos humanos, saludos informales, encabezados de chat y firmas
 * habituales en mensajes de WhatsApp, Slack o correos electrónicos.
 */
export function stripHumanPreambleAndNoise(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // 1. Quitar timestamps de WhatsApp/Slack ej. "[10:45, 12/4/2026] Juan Perez: " o "12/04/26, 14:30 - Maria:"
  cleaned = cleaned.replace(/^\[?\d{1,2}[\/\:\-\.]\d{1,2}(?:[\/\:\-\.]\d{2,4})?,?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?m\.?)?\]?\s*(?:-\s*)?[^:\n]+:\s*/gim, "");

  // 2. Quitar saludos iniciales comunes
  const preamblePatterns = [
    /^(?:hola(?:\s+(?:chicos|chicas|gente|equipo|todos|todas|amigos|amigas))?|buen(?:os)?\s+(?:d[ií]as|tardes|noches)|estimad[oa]s?|buenas)\s*[,:\.\-!\?]*\s*/i,
    /^(?:les\s+comparto|les\s+paso|les\s+dejo|ac[aá]\s+(?:va|tienen|est[aá])|f[ií]jense\s+este|miren\s+(?:este|esta)|data\s+de|info(?:\s+del)?)\s*(?:convocatoria|festi|festival)?\s*[:\.\-!\?]*\s*/i,
    /^(?:copio\s+(?:data|informaci[oó]n|texto)|reenv[ií]o\s+info)\s*[:\.\-!\?]*\s*/i
  ];

  for (const pattern of preamblePatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // 3. Quitar firmas y despedidas finales comunes
  const farewellPatterns = [
    /\s*(?:abrazo(?:\s+grande)?|saludos(?:\s+cordiales)?|besos|gracias|muchas\s+gracias|chau|saludos\s+a\s+todos)\s*[\.\-!\?]*$/i,
    /\s*enviado\s+desde\s+mi\s+(?:iphone|android|dispositivo\s+m[oó]vil).*$/i
  ];

  for (const pattern of farewellPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  return cleaned.trim();
}

/**
 * Limpia conectores huérfanos y palabras incompletas al final de títulos
 * (ej. "Festival Internacional de", "Muestra de Cine del", "Concurso Gu").
 */
export function cleanTrailingConnectorsAndIncompleteWords(title: string): string {
  if (!title) return "";

  let clean = title.trim();

  // Conectores y preposiciones prohibidas al final de un título
  const trailingConnectorsRegex = /\s+(?:de|del|en|para|por|y|e|o|u|a|con|la|el|los|las|al|da|do|des)$/i;

  let iterations = 0;
  while (trailingConnectorsRegex.test(clean) && iterations < 4) {
    clean = clean.replace(trailingConnectorsRegex, "").trim();
    iterations++;
  }

  // Palabras truncadas menores a 3 caracteres que no sean siglas legítimas
  clean = clean.replace(/\s+[A-Za-z]{1,2}$/, (match) => {
    const word = match.trim();
    if (["A", "I", "II", "IV", "VI", "IX", "X", "XI", "XV", "XX"].includes(word)) {
      return match;
    }
    return "";
  }).trim();

  return clean;
}

/**
 * Determina si una línea es un título de festival legítimo o simple ruido/oración común.
 */
export function isLegitimateFestivalTitle(title: string): boolean {
  if (!title || title.length < 3 || title.length > 120) return false;

  const lower = title.toLowerCase();

  // 1. Descarte inmediato ante combinaciones de exclusión contextual (deportes, fútbol, música, comida)
  const quickExclusions = [
    /\bfestival\s+de\s+(?:goles|faltas|penales|patadas|errores|atajadas|puntos|tiros|corners?)\b/i,
    /\b(?:goleada|partido\s+de\s+f[uú]tbol|boca\s+juniors|river\s+plate|la\s+bombonera|el\s+monumental)\b/i,
    /\bfestival\s+de\s+(?:m[uú]sica|rock|jazz|trap|cumbia|folklore|electr[oó]nica|bandas)\b/i,
    /\bfestival\s+(?:gastron[oó]mico|de\s+la\s+cerveza|de\s+comida|del\s+asado|del\s+vino)\b/i,
  ];
  for (const pattern of quickExclusions) {
    if (pattern.test(lower)) return false;
  }

  // 2. Si coincide con la semilla canónica
  if (matchSeedFestival(title)) return true;

  // 3. Términos fuertes que definen un festival o muestra audiovisual
  const festivalKeywords = [
    "festival", "fest", "filmfest", "zinemaldia", "muestra", "concurso",
    "certamen", "bienal", "cortometrajes", "short film", "cine", "cinema"
  ];

  const hasKeyword = festivalKeywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(lower));
  if (hasKeyword) {
    // Descartar si es una frase conversacional
    const nonTitleStarters = /^(si|pero|cuando|porque|donde|recordar|recuerden|atencion|aviso|fijate|mira|hola)/i;
    if (nonTitleStarters.test(lower)) return false;

    // Regla de co-ocurrencia en el título si es genérico:
    const genericOnly = /^(?:festival|muestra|concurso|certamen|bienal)\s+de\s+[a-z]+/i.test(lower);
    if (genericOnly) {
      const hasAudiovisualTerm = /\b(?:cine|cinema|film|films|cortometrajes?|cortos?|largometrajes?|largos?|animaci[oó]n|documental|pel[ií]culas?)\b/i.test(lower);
      if (!hasAudiovisualTerm) {
        return false;
      }
    }

    return true;
  }

  return false;
}

/**
 * Normaliza fechas procedentes de texto libre a formato estricto ISO YYYY-MM-DD.
 */
export function normalizeDateToISO(dateStr?: string, refDate?: string): string | undefined {
  if (!dateStr || typeof dateStr !== 'string') return undefined;
  const clean = dateStr.trim();

  // 1. Formato ISO ya existente: YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return clean;

  // 2. Formatos deterministas comunes: DD/MM/YYYY o DD-MM-YYYY
  const slashMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  const baseDate = refDate ? new Date(refDate) : new Date();

  // 3. Parser Chrono en español e inglés
  const parsedEs = chrono.es.parseDate(clean, baseDate);
  if (parsedEs) {
    return parsedEs.toISOString().split('T')[0];
  }

  const parsedEn = chrono.en.parseDate(clean, baseDate);
  if (parsedEn) {
    return parsedEn.toISOString().split('T')[0];
  }

  return undefined;
}

/**
 * Extrae montos o costo de arancel (fee) del texto discriminando gratuidad.
 */
export function extractFee(text: string): { price: string; fee?: number } {
  if (!text) return { price: "Gratis" };
  const lower = text.toLowerCase();

  // 1. Patrones de gratuidad explícita
  if (
    /\b(gratis|free|sin costo|no fee|0 usd|0 eur|0 dolares|gratuita|inscripci[oó]n gratuita)\b/i.test(lower)
  ) {
    return { price: "Gratis", fee: 0 };
  }

  // 2. Monedas específicas ($12 USD, 15 EUR, 12 USD, $15, etc.)
  const moneyPattern = /(?:[\$€£]\s*(\d+(?:[\.,]\d{1,2})?)|(\d+(?:[\.,]\d{1,2})?)\s*(?:usd|eur|d[oó]lares|euros|ars|\$|€))/i;
  const match = text.match(moneyPattern);

  if (match) {
    const rawVal = match[1] || match[2];
    const cleanNum = rawVal.replace(",", ".");
    const val = parseFloat(cleanNum);
    if (!isNaN(val)) {
      if (text.includes("€") || lower.includes("eur") || lower.includes("euros")) {
        return { price: `${val} EUR`, fee: val };
      }
      return { price: `$${val} USD`, fee: val };
    }
  }

  return { price: "Gratis" };
}

/**
 * Detecta el país y ciudad basándose en el texto, ISO countries y la semilla geográfica curada.
 */
export function extractLocation(text: string): { country: string; city?: string } {
  if (!text) return { country: "A confirmar" };

  // 1. Probar primero con la semilla geográfica con límites de palabra (\b)
  for (const [key, entry] of Object.entries(AUDIVISUAL_GEOGRAPHY_SEED)) {
    const cityRegex = new RegExp(`\\b${key}\\b`, "i");
    if (cityRegex.test(text)) {
      return { country: entry.country, city: entry.city };
    }
  }

  // 2. Probar con países frecuentes en festivales cinematográficos
  const frequentCountries = [
    "Argentina", "España", "Francia", "Alemania", "Italia", "México", "Chile",
    "Brasil", "Colombia", "Estados Unidos", "Canadá", "Perú", "Uruguay",
    "Reino Unido", "Japón", "Finlandia", "Bélgica", "Portugal", "Suiza", "Austria"
  ];
  for (const c of frequentCountries) {
    if (new RegExp(`\\b${c}\\b`, "i").test(text)) {
      return { country: c };
    }
  }

  // 3. Probar con países ISO con nombres de al menos 4 letras
  const allEsCountries = countries.getNames("es", { select: "official" });
  for (const countryName of Object.values(allEsCountries)) {
    if (countryName && countryName.length >= 4) {
      const nameRegex = new RegExp(`\\b${countryName}\\b`, "i");
      if (nameRegex.test(text)) {
        return { country: countryName };
      }
    }
  }

  return { country: "A confirmar" };
}

/**
 * Detecta la categoría de festival (Cortometraje, Largometraje, Animación, etc.).
 */
export function extractCategory(text: string): string {
  if (!text) return "Cortometraje";
  const lower = text.toLowerCase();

  if (lower.includes("animaci") || lower.includes("animation")) return "Animación";
  if (lower.includes("documental") || lower.includes("documentary")) return "Documental";
  if (lower.includes("largometraje") || lower.includes("feature film") || lower.includes("feature")) return "Largometraje";
  if (lower.includes("experimental")) return "Experimental";
  if (lower.includes("estudiante") || lower.includes("student")) return "Estudiante";
  if (lower.includes("terror") || lower.includes("horror") || lower.includes("fantástico") || lower.includes("fantastico")) return "Fantástico / Terror";
  if (lower.includes("cortometraje") || lower.includes("short film") || lower.includes("short") || lower.includes("cortos")) return "Cortometraje";

  return "Cortometraje";
}

/**
 * Extrae los enlaces web encontrados en el bloque de texto.
 */
export function extractLinks(text: string): string[] {
  if (!text) return [];
  const found = linkify.find(text);
  return found.filter((item) => item.type === "url").map((item) => item.href);
}

/**
 * Detecta si el texto es un lote múltiple o un único festival extenso.
 * Evita falsos lotes donde un festival individual tiene múltiples párrafos descriptivos.
 */
export function isBatchText(text: string): boolean {
  if (!text) return false;
  const normalized = text.replace(/\r\n/g, "\n").trim();

  // 1. Si tiene viñetas o números de lista explícitos (ej. 1., 2., 3.)
  const numberedListMatches = normalized.match(/(?:^|\n)\s*(?:\d+[\.\)]|[•\-\*])\s+[A-Za-z]/g);
  if (numberedListMatches && numberedListMatches.length >= 2) {
    return true;
  }

  // 2. Si hay múltiples bloques separados por doble salto
  const doubleBreakBlocks = normalized
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b.length > 15);

  if (doubleBreakBlocks.length < 2) {
    return false;
  }

  // Secciones descriptivas secundarias que NO constituyen un festival nuevo
  const subSectionStarters = /^(?:requisitos|secciones|categor[ií]as|premios|bases|fechas?|fecha\s+l[ií]mite|deadline|plataforma|contacto|jurado|costos?|aranceles?|inscripci[oó]n|reglamento|duraci[oó]n)[:\s]/i;

  const detectedFestivalIds = new Set<string>();
  let distinctTitlesCount = 0;

  for (const block of doubleBreakBlocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0] || "";

    if (subSectionStarters.test(firstLine)) {
      continue;
    }

    const matchedSeed = matchSeedFestival(firstLine) || matchSeedFestival(block);
    if (matchedSeed) {
      if (!detectedFestivalIds.has(matchedSeed.id)) {
        detectedFestivalIds.add(matchedSeed.id);
        distinctTitlesCount++;
      }
    } else if (isLegitimateFestivalTitle(firstLine)) {
      distinctTitlesCount++;
    }
  }

  return distinctTitlesCount >= 2;
}

/**
 * Segmenta un texto de lote en bloques individuales con aislamiento hermético de sellos/tags por bloque.
 */
export function smartSegmentBatchText(text: string): string[] {
  if (!text) return [];
  const cleaned = stripHumanPreambleAndNoise(text).replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];

  // Si no es lote, devolver bloque único
  if (!isBatchText(cleaned)) {
    return [cleaned];
  }

  // 1. Segmentar por viñetas o listas numeradas si existen
  const bulletBlocks = cleaned
    .split(/\n(?=\s*(?:\d+[\.\)]|[•\-\*])\s+[A-Za-z])/)
    .map((b) => b.trim())
    .filter((b) => b.length > 10);

  if (bulletBlocks.length > 1) {
    return bulletBlocks;
  }

  // 2. Segmentar por doble salto de línea
  const doubleBreakBlocks = cleaned
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b.length > 10);

  if (doubleBreakBlocks.length > 1) {
    return doubleBreakBlocks;
  }

  return [cleaned];
}

/**
 * Analiza un texto narrativo o de chat informal (WhatsApp, Slack, emails).
 */
export function parseNarrativeOrChatFestivalText(text: string, refDate?: string): ExtractedFestivalCandidate {
  const stripped = stripHumanPreambleAndNoise(text);
  const matchedSeed = matchSeedFestival(stripped);

  let title = matchedSeed ? matchedSeed.name : "";

  // Si no coincidió con semilla, buscar por expresiones regulares de festivales en la narración
  if (!title) {
    const festMention = stripped.match(/(?:festival\s+(?:internacional\s+)?(?:de\s+)?(?:cine\s+)?(?:audiovisual\s+)?(?:de\s+)?(?:en\s+)?[A-Za-zÀ-ÿ0-9\s\-]+|muestra\s+de\s+[A-Za-zÀ-ÿ0-9\s\-]+|concurso\s+de\s+[A-Za-zÀ-ÿ0-9\s\-]+)/i);
    if (festMention) {
      title = festMention[0].split(/[,\.\n]/)[0].trim();
    } else {
      const lines = stripped.split("\n").map((l) => l.trim()).filter(Boolean);
      title = lines[0] || "Festival sin título";
    }
  }

  title = cleanTrailingConnectorsAndIncompleteWords(title);

  // Ubicación y sede
  const loc = extractLocation(stripped);
  const country = matchedSeed ? matchedSeed.country : loc.country;
  const projectionLocation = matchedSeed && matchedSeed.city ? `${matchedSeed.city}, ${country}` : loc.city;

  // Enlaces y plataforma
  const links = extractLinks(stripped);
  const mainLink = links[0] || (matchedSeed ? matchedSeed.canonicalUrl : undefined);
  let platform = "Propia";
  if (mainLink) {
    const platInfo = extractPlatformSlug(mainLink);
    if (platInfo) {
      platform = platInfo.platform;
    }
  }

  // Detección de fechas
  const baseDate = refDate ? new Date(refDate) : new Date();
  const parsedDates = chrono.es.parse(stripped, baseDate).concat(chrono.en.parse(stripped, baseDate));
  let deadline: string | undefined = undefined;
  const validCalendarDate = parsedDates.find(
    (d) => d.start && d.start.isCertain("month") && (d.start.isCertain("day") || d.start.isCertain("year"))
  );
  if (validCalendarDate && validCalendarDate.start) {
    deadline = validCalendarDate.start.date().toISOString().split("T")[0];
  } else if (parsedDates.length > 0 && parsedDates[0].start) {
    deadline = parsedDates[0].start.date().toISOString().split("T")[0];
  }

  const feeInfo = extractFee(stripped);
  const category = extractCategory(stripped);
  const accreditations = detectAccreditations(stripped);
  const isClosed = isDiscardedOrClosed(stripped);

  return {
    name: title,
    country,
    projectionLocation,
    deadline,
    link: mainLink,
    platform,
    price: feeInfo.price,
    fee: feeInfo.fee,
    category,
    status: FestivalStatus.POR_ENVIAR,
    type: "Festival🎬",
    detectedAccreditations: accreditations,
    isClosedOrDiscarded: isClosed,
    rawSnippet: stripped,
    extractionConfidence: matchedSeed ? 0.95 : 0.8
  };
}

/**
 * Analiza un texto estructurado o semi-estructurado de festival.
 */
export function parseClipboardFestivalText(block: string, refDate?: string): ExtractedFestivalCandidate {
  const stripped = stripHumanPreambleAndNoise(block);
  const lines = stripped.split("\n").map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] || "Festival sin título";

  const matchedSeed = matchSeedFestival(stripped);

  let name = matchedSeed ? matchedSeed.name : firstLine.replace(/^(?:festival|convocatoria|open call|submit to|festi)[:\s-]*/i, "").trim();
  name = cleanTrailingConnectorsAndIncompleteWords(name);

  // Enlaces y plataforma
  const links = extractLinks(stripped);
  const mainLink = links[0] || (matchedSeed ? matchedSeed.canonicalUrl : undefined);
  let platform = "Propia";
  if (mainLink) {
    const platInfo = extractPlatformSlug(mainLink);
    if (platInfo) {
      platform = platInfo.platform;
    }
  }

  // Ubicación
  const loc = extractLocation(stripped);
  const country = matchedSeed ? matchedSeed.country : loc.country;
  const projectionLocation = matchedSeed && matchedSeed.city ? `${matchedSeed.city}, ${country}` : loc.city;

  // Fechas
  const baseDate = refDate ? new Date(refDate) : new Date();
  let deadline: string | undefined = undefined;
  let newsDate: string | undefined = undefined;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    const cleanLine = lowerLine.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (
      cleanLine.includes("deadline") ||
      cleanLine.includes("cierre") ||
      cleanLine.includes("limite") ||
      cleanLine.includes("fecha limite") ||
      cleanLine.includes("due date")
    ) {
      const datesFound = chrono.es.parse(line, baseDate).concat(chrono.en.parse(line, baseDate));
      const validDate = datesFound.find((d) => d.start && (d.start.isCertain("day") || d.start.isCertain("month")));
      if (validDate && validDate.start) {
        deadline = validDate.start.date().toISOString().split("T")[0];
      }
    }

    if (
      cleanLine.includes("notification") ||
      cleanLine.includes("anuncio") ||
      cleanLine.includes("notificacion") ||
      cleanLine.includes("seleccion") ||
      cleanLine.includes("news")
    ) {
      const datesFound = chrono.es.parse(line, baseDate).concat(chrono.en.parse(line, baseDate));
      const validDate = datesFound.find((d) => d.start && (d.start.isCertain("day") || d.start.isCertain("month")));
      if (validDate && validDate.start) {
        newsDate = validDate.start.date().toISOString().split("T")[0];
      }
    }
  }

  // Fallback para fecha límite genérica de calendario si no se halló por keyword
  if (!deadline) {
    const genericDates = chrono.es.parse(stripped, baseDate).concat(chrono.en.parse(stripped, baseDate));
    const validCalendarDate = genericDates.find(
      (d) => d.start && d.start.isCertain("month") && (d.start.isCertain("day") || d.start.isCertain("year"))
    );
    if (validCalendarDate && validCalendarDate.start) {
      deadline = validCalendarDate.start.date().toISOString().split("T")[0];
    }
  }

  const feeInfo = extractFee(stripped);
  const category = extractCategory(stripped);
  const accreditations = detectAccreditations(stripped);
  const isClosed = isDiscardedOrClosed(stripped);

  return {
    name,
    country,
    projectionLocation,
    deadline,
    newsDate,
    link: mainLink,
    platform,
    price: feeInfo.price,
    fee: feeInfo.fee,
    category,
    status: FestivalStatus.POR_ENVIAR,
    type: "Festival🎬",
    detectedAccreditations: accreditations,
    isClosedOrDiscarded: isClosed,
    rawSnippet: stripped,
    extractionConfidence: matchedSeed ? 0.95 : 0.8
  };
}

/**
 * Función principal para extraer un único festival desde texto (utilizada por botón de autocompletado).
 */
export function detectFestivalFromText(text: string, refDate?: string): ExtractedFestivalCandidate {
  if (!text || !text.trim()) {
    return { name: "", country: "A confirmar", price: "Gratis" };
  }

  // Filtrado determinista de relevancia cinematográfica
  if (!hasFestivalRelevance(text)) {
    return { name: "", country: "A confirmar", price: "Gratis" };
  }

  const stripped = stripHumanPreambleAndNoise(text);
  const isNarrative = stripped.includes("?") || stripped.includes("!") || stripped.split("\n").length <= 2;

  if (isNarrative && !stripped.includes("Deadline:") && !stripped.includes("Platform:")) {
    return parseNarrativeOrChatFestivalText(stripped, refDate);
  }

  return parseClipboardFestivalText(stripped, refDate);
}

export const CONTEXT_EXCLUSION_PATTERNS = [
  // Deportes / Fútbol / Metáforas deportivas
  /\bfestival\s+de\s+(?:goles|faltas|penales|patadas|errores|atajadas|puntos|tiros|corners?)\b/i,
  /\b(?:goleada|partido\s+de\s+f[uú]tbol|boca\s+juniors|river\s+plate|la\s+bombonera|el\s+monumental|copa\s+libertadores)\b/i,
  /\b(?:jugador|delantero|arquero|mediocampista|dt|director\s+t[eé]cnico|penal|tiro\s+libre)\b/i,
  // Música / Recitales / Conciertos masivos
  /\bfestival\s+de\s+(?:m[uú]sica|rock|jazz|trap|cumbia|folklore|electr[oó]nica|bandas)\b/i,
  /\b(?:recital|concierto|lineup\s+de\s+bandas|lollapalooza|cosqu[ií]n\s+rock|quilmes\s+rock)\b/i,
  // Gastronomía / Ferias ajenas
  /\bfestival\s+(?:gastron[oó]mico|de\s+la\s+cerveza|de\s+comida|del\s+asado|del\s+vino)\b/i,
  /\b(?:food\s*trucks?|cerveza\s+artesanal|degustaci[oó]n|cata\s+de\s+vinos)\b/i,
  // Artes escénicas ajenas sin audiovisual
  /\bfestival\s+de\s+(?:teatro|danza|ballet|circo|magia)\b/i
];

export const AUDIOVISUAL_DOMAIN_TERMS = [
  /\b(?:cine|cinema|cinematogr[aá]fic[oa]|filmmaker|filmmaking)\b/i,
  /\b(?:film|films|filmfest|filmfestival|zinemaldia)\b/i,
  /\b(?:pel[ií]cula|pel[ií]culas|motion\s+picture)\b/i,
  /\b(?:cortometraje|cortometrajes|cortos?|short\s+film|shortfilms?)\b/i,
  /\b(?:largometraje|largometrajes|largos?|feature\s+film)\b/i,
  /\b(?:animaci[oó]n|animation|documental|documentales|documentary)\b/i,
  /\b(?:filmfreeway|festhome|shortfilmdepot|movibeta|clickforfestivals)\b/i,
  /\b(?:laurel|laurels|palmar[eé]s|premiere|estreno|secci[oó]n\s+oficial|selecci[oó]n\s+oficial)\b/i,
  /\b(?:jurado|bases\s+y\s+condiciones|reglamento|arancel|entry\s+fee|submission\s+fee)\b/i,
  /\b(?:call\s+for\s+entries|submissions?|early\s+bird|entry\s+deadline|fecha\s+l[ií]mite|cierre\s+de\s+convocatoria)\b/i
];

export const GENERIC_CALL_TERMS = [
  /\b(?:festival|festi)\b/i,
  /\b(?:convocatoria|convocatorias|postulaci[oó]n|postulaciones|inscripci[oó]n|inscribir)\b/i,
  /\b(?:muestra|concurso|certamen|bienal|competencia)\b/i
];

/**
 * Valida de forma determinista si un texto posee relevancia como convocatoria cinematográfica.
 * Bloquea código fuente, reportes de QA y metáforas ajenas (ej. deportes, fútbol, recitales).
 */
export function hasFestivalRelevance(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  // 1. Si coincide directamente con el catálogo semilla canónico (ej. Sitges, Cannes, BAFICI)
  if (matchSeedFestival(trimmed)) {
    return true;
  }

  if (trimmed.length < 15) return false;

  // 2. Detección estricta de código fuente, trazas técnicas y reportes internos
  const codeAndTechnicalPatterns = [
    /\b(?:import\s+.*from|export\s+(?:const|function|interface|type|class|default))\b/i,
    /\b(?:const|let|var)\s+[a-zA-Z0-9_$]+\s*[:=]/,
    /\b(?:interface|type)\s+[A-Z][a-zA-Z0-9_$]+\s*[{=]/,
    /\b(?:function\s+[a-zA-Z0-9_$]+\s*\(|=>\s*\{|\(\)\s*=>)/,
    /\b(?:React\.FC|useState|useEffect|useRef|useMemo|useCallback)\b/,
    /<(?:div|span|button|h[1-6]|p|input|motion\.[a-z]+)\b/i,
    /\b(?:className=|style=|onClick=|onChange=)/,
    /\b(?:REPORTE DE AUDITORÍA|CONTROL DE CALIDAD|QA Suite|Vitest|passed|failed|test files)\b/i,
    /\b(?:error TS\d+|stack trace|at\s+[a-zA-Z0-9_$.]+\s*\(|node_modules)\b/i,
    /\b(?:FestivalModal|FestivalListView|BatchClipboardDetectionModal|ProcessingExtractionModal)\b/,
  ];

  for (const pattern of codeAndTechnicalPatterns) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // 3. Filtro de exclusión contextual temprana (metáforas deportivas, fútbol, recitales, gastronomía)
  for (const pattern of CONTEXT_EXCLUSION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // 4. Regla estricta de Co-ocurrencia Audiovisual:
  // La presencia de términos genéricos ('festival', 'muestra', 'concurso', 'certamen')
  // SOLO es válida si coexiste con al menos un término del dominio cinematográfico
  const hasGenericCallTerm = GENERIC_CALL_TERMS.some((regex) => regex.test(trimmed));
  const hasAudiovisualDomainTerm = AUDIOVISUAL_DOMAIN_TERMS.some((regex) => regex.test(trimmed));

  return hasGenericCallTerm && hasAudiovisualDomainTerm;
}

/**
 * Función principal para extraer múltiples festivales (utilizada por el pipeline de lotes).
 */
export function detectMultipleFestivalsFromText(text: string, refDate?: string): ExtractedFestivalCandidate[] {
  if (!text || !text.trim() || !hasFestivalRelevance(text)) return [];

  const blocks = smartSegmentBatchText(text);
  return blocks.map((b) => detectFestivalFromText(b, refDate));
}

export const PERSISTENT_CACHE_STORAGE_KEY = 'festis_clipboard_cache_v1';
export const PERSISTENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas (86.400.000 ms)
export const MAX_PERSISTENT_ENTRIES = 50;

export interface PersistentCacheEntry {
  hashKey: string;
  rawText: string;
  items: ExtractedFestivalCandidate[];
  totalDetected: number;
  timestamp: number;
  expiresAt: number;
}

const memoryCache = new Map<string, PersistentCacheEntry>();

/**
 * Normaliza el texto para generar una clave única de caché
 */
export function normalizeClipboardTextForCache(text: string, refDate?: string): string {
  const norm = text.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${refDate || ''}:::${norm}`;
}

export function loadPersistentClipboardCache(): PersistentCacheEntry[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(PERSISTENT_CACHE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    const valid = parsed.filter((e) => e && typeof e.expiresAt === 'number' && e.expiresAt > now);
    if (valid.length !== parsed.length) {
      localStorage.setItem(PERSISTENT_CACHE_STORAGE_KEY, JSON.stringify(valid));
    }
    return valid;
  } catch {
    return [];
  }
}

export function savePersistentClipboardCache(entries: PersistentCacheEntry[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const trimmed = entries.slice(-MAX_PERSISTENT_ENTRIES);
    localStorage.setItem(PERSISTENT_CACHE_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Manejo defensivo ante almacenamiento lleno
  }
}

/**
 * Limpia el caché en memoria y en localStorage
 */
export function clearClipboardMemoryCache(): void {
  memoryCache.clear();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(PERSISTENT_CACHE_STORAGE_KEY);
    } catch {}
  }
}

export function clearPersistentClipboardCache(): void {
  clearClipboardMemoryCache();
}

/**
 * Consulta el resultado en caché persistente o en memoria si aún está vigente
 */
export function getCachedClipboardResult(rawClipboard: string, refDate?: string): {
  items: ExtractedFestivalCandidate[];
  totalDetected: number;
} | null {
  if (!rawClipboard) return null;
  const key = normalizeClipboardTextForCache(rawClipboard, refDate);

  // 1. Memoria rápida
  const memEntry = memoryCache.get(key);
  if (memEntry) {
    if (Date.now() > memEntry.expiresAt) {
      memoryCache.delete(key);
    } else {
      return {
        items: memEntry.items.map((i) => ({ ...i })),
        totalDetected: memEntry.totalDetected,
      };
    }
  }

  // 2. LocalStorage persistente (24h)
  const persistentEntries = loadPersistentClipboardCache();
  const persistentEntry = persistentEntries.find((e) => e.hashKey === key);
  if (persistentEntry) {
    if (Date.now() <= persistentEntry.expiresAt) {
      memoryCache.set(key, persistentEntry);
      return {
        items: persistentEntry.items.map((i) => ({ ...i })),
        totalDetected: persistentEntry.totalDetected,
      };
    }
  }

  return null;
}

/**
 * Guarda en caché persistente de 24 horas y en memoria el resultado estructurado
 */
export function setCachedClipboardResult(
  rawClipboard: string,
  result: { items: ExtractedFestivalCandidate[]; totalDetected: number },
  refDate?: string
): void {
  if (!rawClipboard) return;
  const key = normalizeClipboardTextForCache(rawClipboard, refDate);
  const now = Date.now();
  const expiresAt = now + PERSISTENT_CACHE_TTL_MS;

  const newEntry: PersistentCacheEntry = {
    hashKey: key,
    rawText: rawClipboard.slice(0, 300),
    items: result.items.map((i) => ({ ...i })),
    totalDetected: result.totalDetected,
    timestamp: now,
    expiresAt,
  };

  // Guardar en memoria (límite FIFO)
  if (memoryCache.size >= MAX_PERSISTENT_ENTRIES) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(key, newEntry);

  // Guardar en localStorage
  const existing = loadPersistentClipboardCache().filter((e) => e.hashKey !== key);
  existing.push(newEntry);
  savePersistentClipboardCache(existing);
}

/**
 * Recupera todos los candidatos analizados durante las últimas 24 horas para deduplicación dual
 */
export function getAllCachedFestivalCandidatesFromToday(): ExtractedFestivalCandidate[] {
  const entries = loadPersistentClipboardCache();
  const all: ExtractedFestivalCandidate[] = [];
  const seenNames = new Set<string>();

  for (const entry of entries) {
    if (Array.isArray(entry.items)) {
      for (const item of entry.items) {
        const normName = (item.name || '').toLowerCase().trim();
        if (normName && !seenNames.has(normName)) {
          seenNames.add(normName);
          all.push(item);
        }
      }
    }
  }

  return all;
}

/**
 * Función pública principal de captura del portapapeles.
 * Procesa localmente y en caso de disponibilidad recurre al endpoint de lote.
 */
export async function parseClipboardContent(rawClipboard: string, refDate?: string): Promise<{
  items: ExtractedFestivalCandidate[];
  totalDetected: number;
}> {
  if (!rawClipboard || !rawClipboard.trim()) {
    return { items: [], totalDetected: 0 };
  }

  // Filtro de relevancia de dominio y regla de co-ocurrencia
  if (!hasFestivalRelevance(rawClipboard)) {
    return { items: [], totalDetected: 0 };
  }

  // 0. Consulta de caché persistente de 24h anti-consumo de cuota
  const cached = getCachedClipboardResult(rawClipboard, refDate);
  if (cached) {
    return cached;
  }

  // 1. Intentar enriquecimiento en backend con fallback suave
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 2000) : null;
    const res = await fetch("/api/parse-festivals-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller?.signal,
      body: JSON.stringify({
        rawText: rawClipboard,
        fechaReferencia: refDate || new Date().toISOString().split("T")[0]
      })
    });
    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.items) && json.items.length > 0) {
        const mapped: ExtractedFestivalCandidate[] = json.items.map((item: any) => ({
          name: cleanTrailingConnectorsAndIncompleteWords(item.name || "Festival sin título"),
          country: item.country || "A confirmar",
          projectionLocation: item.city ? `${item.city}, ${item.country}` : item.projectionLocation,
          deadline: normalizeDateToISO(item.deadline, refDate),
          newsDate: normalizeDateToISO(item.newsDate, refDate),
          link: item.link || item.url,
          platform: item.platform || "Propia",
          price: item.price || (item.fee ? `$${item.fee} USD` : "Gratis"),
          fee: typeof item.fee === "number" ? item.fee : undefined,
          category: item.category || "Cortometraje",
          status: FestivalStatus.POR_ENVIAR,
          type: "Festival",
          detectedAccreditations: item.accreditations || [],
          extractionConfidence: 0.95
        }));
        const finalResult = { items: mapped, totalDetected: mapped.length };
        setCachedClipboardResult(rawClipboard, finalResult, refDate);
        return finalResult;
      }
    }
  } catch {
    // Degradar silenciosamente a procesamiento determinista local
  }

  // 2. Procesamiento local determinista
  const localItems = detectMultipleFestivalsFromText(rawClipboard, refDate);
  const localResult = {
    items: localItems,
    totalDetected: localItems.length
  };
  setCachedClipboardResult(rawClipboard, localResult, refDate);
  return localResult;
}


