export const VOCABULARY_SEED = {
  accreditations: [
    { key: "oscar", label: "Oscar Qualifying", regex: /\b(oscar|oscars|academy award|academy awards|premios oscar|calificador a los oscar)\b/i },
    { key: "goya", label: "Calificador a los Goya", regex: /\b(goya|premios goya|calificador goya|calificador a los goya)\b/i },
    { key: "bafta", label: "BAFTA Qualifying", regex: /\b(bafta|british academy|calificador bafta)\b/i },
    { key: "melies", label: "Méliès d'or", regex: /\b(melies|méliès d'or|melies d'or|melies d'argent|méliès d'argent)\b/i },
    { key: "fiapf", label: "FIAPF Accredited", regex: /\b(fiapf|federacion internacional de asociaciones de productores cinematograficos)\b/i },
    { key: "incaa", label: "Auspicio INCAA", regex: /\b(incaa|instituto nacional de cine y artes audiovisuales|auspicio incaa)\b/i }
  ],
  discardKeywords: [
    "convocatoria cerrada",
    "deadline passed",
    "inscripciones finalizadas",
    "submissions closed",
    "edición cancelada",
    "call closed",
    "fuera de plazo",
    "plazo vencido",
    "inscripciones cerradas"
  ],
  feeKeywords: [
    "early bird",
    "regular deadline",
    "late deadline",
    "extended deadline",
    "submission fee",
    "entry fee",
    "tasa de inscripción",
    "arancel",
    "precio de postulación",
    "cuota de inscripción"
  ],
  freeKeywords: [
    "gratis",
    "free",
    "sin costo",
    "no fee",
    "0 usd",
    "0 eur",
    "0 dolares",
    "gratuita",
    "inscripción gratuita"
  ]
};

export function detectAccreditations(text: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  for (const acc of VOCABULARY_SEED.accreditations) {
    if (acc.regex.test(text)) {
      found.push(acc.label);
    }
  }
  return found;
}

export function isDiscardedOrClosed(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return VOCABULARY_SEED.discardKeywords.some((keyword) => lower.includes(keyword));
}
