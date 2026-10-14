import { parse } from 'tldts';

export interface PlatformSeed {
  name: string;
  domain: string;
  slugPattern: RegExp;
  category: 'submission_platform' | 'festival_site' | 'aggregator';
}

export const SHARED_PLATFORMS_SEED: PlatformSeed[] = [
  {
    name: "FilmFreeway",
    domain: "filmfreeway.com",
    slugPattern: /filmfreeway\.com\/([a-zA-Z0-9_\-]+)/i,
    category: "submission_platform"
  },
  {
    name: "Festhome",
    domain: "festhome.com",
    slugPattern: /festhome\.com\/(?:[a-z]{2}\/)?(?:festival|f)\/([a-zA-Z0-9_\-]+)/i,
    category: "submission_platform"
  },
  {
    name: "Shortfilmdepot",
    domain: "shortfilmdepot.com",
    slugPattern: /shortfilmdepot\.com\/(?:[a-z]{2}\/)?festival\/([a-zA-Z0-9_\-]+)/i,
    category: "submission_platform"
  },
  {
    name: "Docfilmdepot",
    domain: "docfilmdepot.com",
    slugPattern: /docfilmdepot\.com\/(?:[a-z]{2}\/)?festival\/([a-zA-Z0-9_\-]+)/i,
    category: "submission_platform"
  },
  {
    name: "Clickforfestivals",
    domain: "clickforfestivals.com",
    slugPattern: /clickforfestivals\.com\/([a-zA-Z0-9_\-]+)/i,
    category: "submission_platform"
  },
  {
    name: "Movibeta",
    domain: "movibeta.com",
    slugPattern: /movibeta\.com\/festivals\/([a-zA-Z0-9_\-]+)/i,
    category: "submission_platform"
  },
  {
    name: "Eventival",
    domain: "eventival.com",
    slugPattern: /(?:eventival\.com|eventival\.eu)\/(?:[a-z]{2}\/)?([a-zA-Z0-9_\-]+)/i,
    category: "submission_platform"
  },
  {
    name: "Eventival",
    domain: "eventival.eu",
    slugPattern: /(?:eventival\.com|eventival\.eu)\/(?:[a-z]{2}\/)?([a-zA-Z0-9_\-]+)/i,
    category: "submission_platform"
  },
  {
    name: "Uptofest",
    domain: "uptofest.com",
    slugPattern: /uptofest\.com\/([a-zA-Z0-9_\-]+)/i,
    category: "submission_platform"
  }
];

export function extractPlatformSlug(url: string): { platform: string; slug: string } | null {
  if (!url) return null;
  const parsed = parse(url);
  if (!parsed.domain) return null;

  for (const plat of SHARED_PLATFORMS_SEED) {
    if (parsed.domain.toLowerCase() === plat.domain.toLowerCase()) {
      const match = url.match(plat.slugPattern);
      if (match && match[1]) {
        return { platform: plat.name, slug: match[1].toLowerCase().replace(/\/$/, "") };
      }
      return { platform: plat.name, slug: parsed.domain.toLowerCase() };
    }
  }

  return null;
}
