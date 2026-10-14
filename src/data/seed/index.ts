import { CANONICAL_FESTIVALS_SEED, CanonicalFestival } from './festivals';
import { AUDIVISUAL_GEOGRAPHY_SEED, lookupCountryByCity } from './geography';
import { SHARED_PLATFORMS_SEED, extractPlatformSlug } from './platforms';
import { VOCABULARY_SEED, detectAccreditations, isDiscardedOrClosed } from './vocabulary';

export * from './festivals';
export * from './geography';
export * from './platforms';
export * from './vocabulary';

export function matchSeedFestival(text: string): CanonicalFestival | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // 1. Coincidencia por nombre exacto o alias
  for (const fest of CANONICAL_FESTIVALS_SEED) {
    if (new RegExp(`\\b${fest.name.toLowerCase()}\\b`, "i").test(lower)) {
      return fest;
    }
    for (const alias of fest.aliases) {
      if (new RegExp(`\\b${alias.toLowerCase()}\\b`, "i").test(lower)) {
        return fest;
      }
    }
  }

  // 2. Coincidencia por URL de plataforma o sitio web
  for (const fest of CANONICAL_FESTIVALS_SEED) {
    if (fest.urlPattern && lower.includes(fest.urlPattern.toLowerCase())) {
      return fest;
    }
  }

  return null;
}

export function lookupCanonicalFestival(nameOrAlias: string): CanonicalFestival | null {
  if (!nameOrAlias) return null;
  const clean = nameOrAlias.toLowerCase().trim();

  for (const fest of CANONICAL_FESTIVALS_SEED) {
    if (fest.name.toLowerCase() === clean || fest.id.toLowerCase() === clean) {
      return fest;
    }
    if (fest.aliases.some((a) => a.toLowerCase() === clean)) {
      return fest;
    }
  }

  return null;
}
