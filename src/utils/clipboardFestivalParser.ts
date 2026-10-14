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
  detectedAccreditations?: string[];
  extractionConfidence?: number;
  detectedCity?: string;
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

  // Si coincide con la semilla canónica
  if (matchSeedFestival(title)) return true;

  // Términos fuertes que definen un festival o muestra audiovisual
  const festivalKeywords = [
    "festival", "fest", "filmfest", "zinemaldia", "muestra", "concurso",
    "certamen", "bienal", "cortometrajes", "short film", "cine", "cinema"
  ];

  const hasKeyword = festivalKeywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(lower));
  if (hasKeyword) {
    // Descartar si es una frase conversacional
    const nonTitleStarters = /^(si|pero|cuando|porque|donde|recordar|recuerden|atencion|aviso|fijate|mira|hola)/i;
    if (nonTitleStarters.test(lower)) return false;
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

  const stripped = stripHumanPreambleAndNoise(text);
  const isNarrative = stripped.includes("?") || stripped.includes("!") || stripped.split("\n").length <= 2;

  if (isNarrative && !stripped.includes("Deadline:") && !stripped.includes("Platform:")) {
    return parseNarrativeOrChatFestivalText(stripped, refDate);
  }

  return parseClipboardFestivalText(stripped, refDate);
}

/**
 * Función principal para extraer múltiples festivales (utilizada por el pipeline de lotes).
 */
export function detectMultipleFestivalsFromText(text: string, refDate?: string): ExtractedFestivalCandidate[] {
  if (!text || !text.trim()) return [];

  const blocks = smartSegmentBatchText(text);
  return blocks.map((b) => detectFestivalFromText(b, refDate));
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

  // 1. Intentar enriquecimiento en backend con fallback suave
  try {
    const res = await fetch("/api/parse-festivals-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawText: rawClipboard,
        fechaReferencia: refDate || new Date().toISOString().split("T")[0]
      })
    });

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
          type: "Festival🎬",
          detectedAccreditations: item.accreditations || [],
          extractionConfidence: 0.95
        }));
        return { items: mapped, totalDetected: mapped.length };
      }
    }
  } catch {
    // Degradar silenciosamente a procesamiento determinista local
  }

  // 2. Procesamiento local determinista
  const localItems = detectMultipleFestivalsFromText(rawClipboard, refDate);
  return {
    items: localItems,
    totalDetected: localItems.length
  };
}
