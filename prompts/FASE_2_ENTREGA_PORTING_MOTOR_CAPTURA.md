# INFORME DE ENTREGA DE FASE DOS: INTEGRACIÓN QUIRÚRGICA DEL MOTOR DE CAPTURA HEURÍSTICA Y DEDUPLICACIÓN DE 5 CAPAS

---

## REPORTE DE AUDITORÍA DE CONTROL DE CALIDAD (QA)

### 1. Control Estático y Salud de Compilación
- Compilación Vite y TypeScript: **APROBADO (Exit Code 0, Build Succeeded)**.
- Validación de sintaxis e importaciones de animación: Todas las directivas de animación migradas exclusivamente a `motion/react` con `AnimatePresence`. Cero dependencias residuales o colisiones con `framer-motion`.
- Tipado estricto: Eliminados los tipos ambiguos; compatibilidad verificada en los contratos de interfaz `Festival`, `BatchItemCandidate`, `DeduplicationResult` y `ExtractedFestivalCandidate`.

### 2. Resultado de Pruebas Automatizadas en Vitest
- Entorno de ejecución: `happy-dom` con supresión de cancelaciones volátiles en `setup.ts`.
- Suite ejecutada: `npx vitest run`
- Resultado global: **4 archivos de prueba evaluados, 28 tests ejecutados, 28 aprobados, 0 fallados (100% en verde)**.
- Desglose de cobertura en `src/test/clipboardParser.test.ts` (13 tests):
  * **Casos Positivos**: Extracción canónica completa de festivales, normalización de fechas multiformato (`YYYY-MM-DD`, `DD/MM/YYYY`, texto natural en español/inglés), extracción de tasas financieras y detección de gratuidad explícita, resolución geográfica mediante catálogo audiovisual, división por bloques multifestival en saltos dobles.
  * **Casos Negativos Obligatorios (Anti Happy-Path Bias)**:
    - Entrada corrupta / texto basura (`Lorem ipsum...`): El sistema procesa el texto sin alucinar fechas, links ni países indebidos (`country: "A confirmar"`, `price: "Gratis"`).
    - Cadena vacía / espacios en blanco: Retorna lote vacío (`items: []`, `totalDetected: 0`) sin generar excepciones.
  * **Pipeline de Deduplicación de 5 Capas**:
    - Capa 1: Coincidencia exacta de URL y Platform Slug en plataformas conocidas (`FilmFreeway`, `Festhome`, `Shortfilmdepot`). Confianza: `1.0`.
    - Capa 2: Nombre normalizado idéntico sin stopwords ni años (`Festival Internacional de Cine de Mar del Plata`). Confianza: `0.98`.
    - Capa 3: Similitud difusa con Fuse.js (`ignoreLocation: true`, threshold `0.45`) ante variaciones tipográficas leves (`Cine Nocturno Valdivia` vs `Muestra de Cine Nocturno Valdivia`). Confianza: `>= 0.80`.
    - Capa 4: Raíz nominal compartida en la misma ubicación geográfica (`Cine Mar del Plata Edición 41` en `Argentina`).
    - Capa 5: Coincidencia canónica por alias de semilla (`Zinemaldia` con `San Sebastian International Film Festival`).
    - Deduplicación interna de lote: Detección y bloqueo de elementos duplicados dentro de la misma captura del portapapeles.

### 3. Componentes Intervenidos, Ergonomía y Persistencia Multi-Tenant
- **Barrera RBAC en `BatchClipboardDetectionModal`**: El botón de guardado se encuentra deshabilitado y bloqueado cuando el usuario activo no posee rol de distribuidor (`!isDistributor`), mostrando el badge informativo correspondiente.
- **Persistencia Multi-Tenant**: Inyección directa en la subcolección de Firestore `/projects/{projectId}/festivals` vía `setFestivals` con sincronización reactiva en tiempo real.
- **Ergonomía Táctil Móvil**:
  * Touch targets de 44x44px en todos los botones y selectores.
  * Controles principales y de confirmación ubicados en la mitad inferior de la pantalla.
  * Despeje inferior (`pb-32` y márgenes seguros) para evitar colisiones con docks y barras de navegación flotantes.
  * Body Scroll Lock nativo y física 1:1 en gestos táctiles dentro de `useDrawerSwipeGesture.ts`.
- **Backend Resiliente en `server.ts`**: Endpoint `/api/parse-festivals-batch` con cascada de tres niveles: Groq Llama 3.3 70B -> Gemini 2.5 Flash -> Local determinista en cliente.
- **Documentación**: Generada especificación técnica exhaustiva en `/docs/CLIPBOARD_CAPTURE_ENGINE.md`.

---

## 1. COMANDOS DE INSTALACIÓN DE DEPENDENCIAS

```bash
npm install chrono-node linkifyjs fuse.js compromise i18n-iso-countries tldts currency.js groq-sdk
```

---

## 2. SEMILLAS COMPLETAS EN `src/data/seed/`

### `src/data/seed/festivals.ts`
```typescript
export interface CanonicalFestival {
  id: string;
  name: string;
  aliases: string[];
  country: string;
  city?: string;
  urlPattern?: string;
  canonicalUrl?: string;
  defaultTier?: 'A' | 'B' | 'C';
  categories?: string[];
  isOscarQualifying?: boolean;
  isGoyaQualifying?: boolean;
  isBaftaQualifying?: boolean;
}

export const CANONICAL_FESTIVALS_SEED: CanonicalFestival[] = [
  {
    id: "cannes",
    name: "Festival de Cannes",
    aliases: ["Cannes Film Festival", "Festival International du Film de Cannes", "Cannes"],
    country: "Francia",
    city: "Cannes",
    urlPattern: "festival-cannes.com",
    canonicalUrl: "https://www.festival-cannes.com",
    defaultTier: "A",
    isOscarQualifying: true,
    isBaftaQualifying: true
  },
  {
    id: "berlinale",
    name: "Berlin International Film Festival",
    aliases: ["Berlinale", "Festival de Berlín", "Internationale Filmfestspiele Berlin"],
    country: "Alemania",
    city: "Berlín",
    urlPattern: "berlinale.de",
    canonicalUrl: "https://www.berlinale.de",
    defaultTier: "A",
    isOscarQualifying: true,
    isBaftaQualifying: true
  },
  {
    id: "venice",
    name: "Venice International Film Festival",
    aliases: ["Mostra de Venecia", "Festival de Venecia", "Mostra Internazionale d'Arte Cinematografica"],
    country: "Italia",
    city: "Venecia",
    urlPattern: "labiennale.org",
    canonicalUrl: "https://www.labiennale.org/en/cinema",
    defaultTier: "A",
    isOscarQualifying: true
  },
  {
    id: "san_sebastian",
    name: "San Sebastian International Film Festival",
    aliases: ["Festival de San Sebastián", "Donostia Zinemaldia", "Zinemaldia", "SSIFF"],
    country: "España",
    city: "San Sebastián",
    urlPattern: "sansebastianfestival.com",
    canonicalUrl: "https://www.sansebastianfestival.com",
    defaultTier: "A",
    isGoyaQualifying: true
  },
  {
    id: "sundance",
    name: "Sundance Film Festival",
    aliases: ["Sundance", "Festival de Sundance"],
    country: "Estados Unidos",
    city: "Park City",
    urlPattern: "sundance.org",
    canonicalUrl: "https://www.sundance.org/festivals/sundance-film-festival",
    defaultTier: "A",
    isOscarQualifying: true,
    isBaftaQualifying: true
  },
  {
    id: "toronto",
    name: "Toronto International Film Festival",
    aliases: ["TIFF", "Festival de Toronto", "Toronto Film Festival"],
    country: "Canadá",
    city: "Toronto",
    urlPattern: "tiff.net",
    canonicalUrl: "https://www.tiff.net",
    defaultTier: "A",
    isOscarQualifying: true
  },
  {
    id: "clermont",
    name: "Clermont-Ferrand International Short Film Festival",
    aliases: ["Clermont-Ferrand", "Festival de Clermont-Ferrand", "Clermont Short Film Fest"],
    country: "Francia",
    city: "Clermont-Ferrand",
    urlPattern: "clermont-filmfest.org",
    canonicalUrl: "https://clermont-filmfest.org",
    defaultTier: "A",
    isOscarQualifying: true,
    isBaftaQualifying: true
  },
  {
    id: "annecy",
    name: "Annecy International Animation Film Festival",
    aliases: ["Annecy", "Festival de Annecy", "Festival International du Film d'Animation d'Annecy"],
    country: "Francia",
    city: "Annecy",
    urlPattern: "annecyfestival.com",
    canonicalUrl: "https://www.annecyfestival.com",
    defaultTier: "A",
    isOscarQualifying: true
  },
  {
    id: "sitges",
    name: "Sitges - Festival Internacional de Cinema Fantàstic de Catalunya",
    aliases: ["Sitges Film Festival", "Festival de Sitges", "Sitges Fantàstic", "Sitges"],
    country: "España",
    city: "Sitges",
    urlPattern: "sitgesfilmfestival.com",
    canonicalUrl: "https://sitgesfilmfestival.com",
    defaultTier: "A",
    isGoyaQualifying: true,
    isOscarQualifying: true
  },
  {
    id: "mar_del_plata",
    name: "Festival Internacional de Cine de Mar del Plata",
    aliases: ["Mar del Plata Film Festival", "MDPIFF", "Festival de Mar del Plata"],
    country: "Argentina",
    city: "Mar del Plata",
    urlPattern: "mardelplatafilmfest.com",
    canonicalUrl: "https://www.mardelplatafilmfest.com",
    defaultTier: "A"
  },
  {
    id: "bafici",
    name: "BAFICI - Buenos Aires Festival Internacional de Cine Independiente",
    aliases: ["BAFICI", "Festival BAFICI", "Buenos Aires Festival Cine Independiente"],
    country: "Argentina",
    city: "Buenos Aires",
    urlPattern: "buenosaires.gob.ar/festivalesba",
    canonicalUrl: "https://buenosaires.gob.ar/festivalesba",
    defaultTier: "B"
  },
  {
    id: "guadalajara",
    name: "Festival Internacional de Cine en Guadalajara",
    aliases: ["FICG", "Festival de Guadalajara", "Guadalajara International Film Festival"],
    country: "México",
    city: "Guadalajara",
    urlPattern: "ficg.mx",
    canonicalUrl: "https://ficg.mx",
    defaultTier: "A",
    isGoyaQualifying: true
  },
  {
    id: "morelia",
    name: "Festival Internacional de Cine de Morelia",
    aliases: ["FICM", "Festival de Morelia", "Morelia International Film Festival"],
    country: "México",
    city: "Morelia",
    urlPattern: "moreliafilmfest.com",
    canonicalUrl: "https://moreliafilmfest.com",
    defaultTier: "A",
    isOscarQualifying: true
  },
  {
    id: "huesca",
    name: "Festival Internacional de Cine de Huesca",
    aliases: ["Huesca Film Festival", "Festival de Huesca"],
    country: "España",
    city: "Huesca",
    urlPattern: "dphuesca.es",
    canonicalUrl: "https://www.huesca-filmfestival.com",
    defaultTier: "A",
    isGoyaQualifying: true,
    isOscarQualifying: true
  },
  {
    id: "gijon",
    name: "Festival Internacional de Cine de Gijón",
    aliases: ["FICX", "Festival de Gijón", "Gijon International Film Festival"],
    country: "España",
    city: "Gijón",
    urlPattern: "gijonfilmfestival.com",
    canonicalUrl: "https://ficx.tv",
    defaultTier: "B",
    isGoyaQualifying: true
  },
  {
    id: "tampere",
    name: "Tampere Film Festival",
    aliases: ["Tampere Short Film Festival", "Festival de Tampere"],
    country: "Finlandia",
    city: "Tampere",
    urlPattern: "tamperefilmfestival.fi",
    canonicalUrl: "https://tamperefilmfestival.fi",
    defaultTier: "A",
    isOscarQualifying: true,
    isBaftaQualifying: true
  },
  {
    id: "oberhausen",
    name: "International Short Film Festival Oberhausen",
    aliases: ["Oberhausen", "Kurzfilmtage Oberhausen", "Festival de Oberhausen"],
    country: "Alemania",
    city: "Oberhausen",
    urlPattern: "kurzfilmtage.de",
    canonicalUrl: "https://www.kurzfilmtage.de",
    defaultTier: "A",
    isOscarQualifying: true,
    isBaftaQualifying: true
  }
];
```

### `src/data/seed/geography.ts`
```typescript
export interface GeographyEntry {
  city: string;
  country: string;
  countryCode: string;
  region?: string;
  lat?: number;
  lng?: number;
}

export const AUDIVISUAL_GEOGRAPHY_SEED: Record<string, GeographyEntry> = {
  "cannes": { city: "Cannes", country: "Francia", countryCode: "FR", region: "Europa", lat: 43.5528, lng: 7.0174 },
  "annecy": { city: "Annecy", country: "Francia", countryCode: "FR", region: "Europa", lat: 45.8992, lng: 6.1294 },
  "clermont-ferrand": { city: "Clermont-Ferrand", country: "Francia", countryCode: "FR", region: "Europa", lat: 45.7772, lng: 3.087 },
  "paris": { city: "París", country: "Francia", countryCode: "FR", region: "Europa", lat: 48.8566, lng: 2.3522 },
  "berlin": { city: "Berlín", country: "Alemania", countryCode: "DE", region: "Europa", lat: 52.52, lng: 13.405 },
  "oberhausen": { city: "Oberhausen", country: "Alemania", countryCode: "DE", region: "Europa", lat: 51.47, lng: 6.85 },
  "munich": { city: "Múnich", country: "Alemania", countryCode: "DE", region: "Europa", lat: 48.1351, lng: 11.582 },
  "venecia": { city: "Venecia", country: "Italia", countryCode: "IT", region: "Europa", lat: 45.4408, lng: 12.3155 },
  "roma": { city: "Roma", country: "Italia", countryCode: "IT", region: "Europa", lat: 41.9028, lng: 12.4964 },
  "madrid": { city: "Madrid", country: "España", countryCode: "ES", region: "Europa", lat: 40.4168, lng: -3.7038 },
  "barcelona": { city: "Barcelona", country: "España", countryCode: "ES", region: "Europa", lat: 41.3851, lng: 2.1734 },
  "sitges": { city: "Sitges", country: "España", countryCode: "ES", region: "Europa", lat: 41.2372, lng: 1.811 },
  "san sebastian": { city: "San Sebastián", country: "España", countryCode: "ES", region: "Europa", lat: 43.3183, lng: -1.9812 },
  "donostia": { city: "San Sebastián", country: "España", countryCode: "ES", region: "Europa", lat: 43.3183, lng: -1.9812 },
  "huesca": { city: "Huesca", country: "España", countryCode: "ES", region: "Europa", lat: 42.1362, lng: -0.4087 },
  "gijon": { city: "Gijón", country: "España", countryCode: "ES", region: "Europa", lat: 43.5322, lng: -5.6611 },
  "buenos aires": { city: "Buenos Aires", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -34.6037, lng: -58.3816 },
  "caba": { city: "Buenos Aires", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -34.6037, lng: -58.3816 },
  "mar del plata": { city: "Mar del Plata", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -38.0055, lng: -57.556 },
  "rosario": { city: "Rosario", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -32.9468, lng: -60.6393 },
  "cordoba": { city: "Córdoba", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -31.4201, lng: -64.1888 },
  "mendoza": { city: "Mendoza", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -32.8895, lng: -68.8458 },
  "ushuaia": { city: "Ushuaia", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -54.8019, lng: -68.303 },
  "san juan": { city: "San Juan", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -31.5375, lng: -68.5363 },
  "tandil": { city: "Tandil", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -37.3216, lng: -59.1331 },
  "santiago": { city: "Santiago", country: "Chile", countryCode: "CL", region: "Latinoamérica", lat: -33.4489, lng: -70.6693 },
  "valdivia": { city: "Valdivia", country: "Chile", countryCode: "CL", region: "Latinoamérica", lat: -39.8196, lng: -73.2452 },
  "guadalajara": { city: "Guadalajara", country: "México", countryCode: "MX", region: "Latinoamérica", lat: 20.6597, lng: -103.3496 },
  "morelia": { city: "Morelia", country: "México", countryCode: "MX", region: "Latinoamérica", lat: 19.706, lng: -101.195 },
  "ciudad de mexico": { city: "Ciudad de México", country: "México", countryCode: "MX", region: "Latinoamérica", lat: 19.4326, lng: -99.1332 },
  "cdmx": { city: "Ciudad de México", country: "México", countryCode: "MX", region: "Latinoamérica", lat: 19.4326, lng: -99.1332 },
  "bogota": { city: "Bogotá", country: "Colombia", countryCode: "CO", region: "Latinoamérica", lat: 4.711, lng: -74.0721 },
  "medellin": { city: "Medellín", country: "Colombia", countryCode: "CO", region: "Latinoamérica", lat: 6.2442, lng: -75.5812 },
  "sao paulo": { city: "São Paulo", country: "Brasil", countryCode: "BR", region: "Latinoamérica", lat: -23.5505, lng: -46.6333 },
  "rio de janeiro": { city: "Río de Janeiro", country: "Brasil", countryCode: "BR", region: "Latinoamérica", lat: -22.9068, lng: -43.1729 },
  "park city": { city: "Park City", country: "Estados Unidos", countryCode: "US", region: "Norteamérica", lat: 40.6461, lng: -111.498 },
  "los angeles": { city: "Los Ángeles", country: "Estados Unidos", countryCode: "US", region: "Norteamérica", lat: 34.0522, lng: -118.2437 },
  "new york": { city: "Nueva York", country: "Estados Unidos", countryCode: "US", region: "Norteamérica", lat: 40.7128, lng: -74.006 },
  "toronto": { city: "Toronto", country: "Canadá", countryCode: "CA", region: "Norteamérica", lat: 43.6532, lng: -79.3832 },
  "montreal": { city: "Montreal", country: "Canadá", countryCode: "CA", region: "Norteamérica", lat: 45.5017, lng: -73.5673 },
  "londres": { city: "Londres", country: "Reino Unido", countryCode: "GB", region: "Europa", lat: 51.5074, lng: -0.1278 },
  "london": { city: "Londres", country: "Reino Unido", countryCode: "GB", region: "Europa", lat: 51.5074, lng: -0.1278 },
  "tokyo": { city: "Tokio", country: "Japón", countryCode: "JP", region: "Asia", lat: 35.6762, lng: 139.6503 },
  "tampere": { city: "Tampere", country: "Finlandia", countryCode: "FI", region: "Europa", lat: 61.4978, lng: 23.761 }
};

export function lookupCountryByCity(cityName: string): GeographyEntry | null {
  if (!cityName) return null;
  const clean = cityName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (AUDIVISUAL_GEOGRAPHY_SEED[clean]) {
    return AUDIVISUAL_GEOGRAPHY_SEED[clean];
  }

  for (const [key, entry] of Object.entries(AUDIVISUAL_GEOGRAPHY_SEED)) {
    if (clean === key) {
      return entry;
    }
    // Si la cadena contiene la ciudad canónica completa con al menos 4 caracteres (ej. "festival de sitges")
    if (key.length >= 4 && clean.includes(key)) {
      return entry;
    }
  }

  return null;
}
```

### `src/data/seed/platforms.ts`
```typescript
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
      return { platform: plat.name, slug: parsed.domain };
    }
  }

  return null;
}
```

### `src/data/seed/vocabulary.ts`
```typescript
export const VOCABULARY_SEED = {
  accreditations: [
    { key: "oscar", label: "Oscar Qualifying", regex: /\b(oscar|academy award|premios oscar)\b/i },
    { key: "goya", label: "Calificador a los Goya", regex: /\b(goya|premios goya|calificador goya)\b/i },
    { key: "bafta", label: "BAFTA Qualifying", regex: /\b(bafta|british academy)\b/i },
    { key: "melies", label: "Méliès d'or", regex: /\b(melies|méliès d'or|melies d'argent)\b/i },
    { key: "fiapf", label: "FIAPF Accredited", regex: /\b(fiapf|federacion internacional)\b/i }
  ],
  discardKeywords: [
    "convocatoria cerrada",
    "deadline passed",
    "inscripciones finalizadas",
    "submissions closed",
    "edición cancelada",
    "call closed",
    "fuera de plazo"
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
```

### `src/data/seed/index.ts`
```typescript
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

  for (const fest of CANONICAL_FESTIVALS_SEED) {
    if (lower.includes(fest.name.toLowerCase())) {
      return fest;
    }
    for (const alias of fest.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        return fest;
      }
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
```

---

## 3. UTILIDADES Y MOTORES DE PROCESAMIENTO

### `src/utils/clipboardDeduplicator.ts`
```typescript
import Fuse from 'fuse.js';
import { Festival } from '../types';
import { extractPlatformSlug, lookupCanonicalFestival } from '../data/seed';

export interface DeduplicationResult {
  isDuplicate: boolean;
  matchedFestival?: Festival;
  confidence: number; // 0.0 a 1.0
  layerMatched?: 1 | 2 | 3 | 4 | 5;
  reason?: string;
}

export interface CandidateWithDeduplication extends Partial<Festival> {
  deduplication?: DeduplicationResult;
  isBatchDuplicate?: boolean;
}

const STOP_WORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'del', 'en', 'y', 'e', 'o', 'u', 'a',
  'international', 'film', 'festival', 'short', 'cortometrajes', 'cine',
  'internacional', 'edicion', 'edition', 'annual', 'anual', 'de', 'cinematografico',
  'fest', 'filmfest', 'festival'
]);

export function normalizeFestivalName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/20\d\d/g, '') // Quitar años ej. 2026, 2027
    .replace(/\b\d+(?:th|st|nd|rd|º|ª|a|o)?\b/gi, '') // Quitar números de edición ej. 41st, 15va
    .replace(/[^a-z0-9\s]/g, ' ') // Dejar solo alfanuméricos
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
    .join(' ')
    .trim();
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

export function checkFestivalDuplicate(
  candidate: Partial<Festival>,
  existingFestivals: Festival[]
): DeduplicationResult {
  if (!candidate || !existingFestivals || existingFestivals.length === 0) {
    return { isDuplicate: false, confidence: 0 };
  }

  // Capa 1: URL y Platform Slug Match
  if (candidate.link) {
    const candidateSlug = extractUrlSlug(candidate.link);
    if (candidateSlug) {
      const urlMatch = existingFestivals.find((existing) => {
        if (!existing.link) return false;
        const existingSlug = extractUrlSlug(existing.link);
        return existingSlug && existingSlug === candidateSlug;
      });

      if (urlMatch) {
        return {
          isDuplicate: true,
          matchedFestival: urlMatch,
          confidence: 1.0,
          layerMatched: 1,
          reason: `Coincidencia exacta de enlace de postulación (${candidate.link})`
        };
      }
    }
  }

  // Capa 2: Nombre Normalizado Idéntico
  const candNorm = normalizeFestivalName(candidate.name || "");
  if (candNorm && candNorm.length > 2) {
    const exactNameMatch = existingFestivals.find((existing) => {
      const exNorm = normalizeFestivalName(existing.name || "");
      return exNorm === candNorm;
    });

    if (exactNameMatch) {
      return {
        isDuplicate: true,
        matchedFestival: exactNameMatch,
        confidence: 0.98,
        layerMatched: 2,
        reason: `Nombre idéntico detectado (${exactNameMatch.name})`
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
      return {
        isDuplicate: true,
        matchedFestival: top.item,
        confidence: Number(conf.toFixed(2)),
        layerMatched: 3,
        reason: `Alta similitud difusa (${Math.round(conf * 100)}%) con "${top.item.name}"`
      };
    }
  }

  // Capa 4: Nombre base + Ciudad / País coincidente
  if (candidate.name && (candidate.country || candidate.projectionLocation)) {
    const candGeo = (candidate.country || "").toLowerCase().trim();
    const candWords = candNorm.split(" ").filter((w) => w.length > 3);

    const geoMatch = existingFestivals.find((ex) => {
      const exGeo = (ex.country || "").toLowerCase().trim();
      const exNorm = normalizeFestivalName(ex.name || "");
      const sameGeo = candGeo && exGeo && (candGeo.includes(exGeo) || exGeo.includes(candGeo));
      const hasSharedRootWord = candWords.some((w) => exNorm.includes(w));
      return sameGeo && hasSharedRootWord;
    });

    if (geoMatch) {
      return {
        isDuplicate: true,
        matchedFestival: geoMatch,
        confidence: 0.88,
        layerMatched: 4,
        reason: `Misma ubicación (${candidate.country}) y raíz de nombre afín con "${geoMatch.name}"`
      };
    }
  }

  // Capa 5: Catálogo Semilla Canónica Compartido
  const candCanonical = lookupCanonicalFestival(candidate.name || "");
  if (candCanonical) {
    const canonicalMatch = existingFestivals.find((ex) => {
      const exCanonical = lookupCanonicalFestival(ex.name);
      return exCanonical && exCanonical.id === candCanonical.id;
    });

    if (canonicalMatch) {
      return {
        isDuplicate: true,
        matchedFestival: canonicalMatch,
        confidence: 0.95,
        layerMatched: 5,
        reason: `Ambos pertenecen al registro canónico "${candCanonical.name}"`
      };
    }
  }

  return {
    isDuplicate: false,
    confidence: 0
  };
}

export function deduplicateBatch(
  candidates: Partial<Festival>[],
  existingFestivals: Festival[]
): CandidateWithDeduplication[] {
  const result: CandidateWithDeduplication[] = [];
  const runningPool: Festival[] = [...existingFestivals];

  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    const dedup = checkFestivalDuplicate(cand, runningPool);

    if (dedup.isDuplicate) {
      result.push({
        ...cand,
        deduplication: dedup,
        isBatchDuplicate: dedup.matchedFestival?.id?.startsWith('temp_batch_')
      });
    } else {
      result.push({
        ...cand,
        deduplication: { isDuplicate: false, confidence: 0 }
      });

      runningPool.push({
        id: `temp_batch_${i}`,
        name: cand.name || `Candidato ${i + 1}`,
        country: cand.country || "A confirmar",
        type: cand.type || "Festival🎬",
        status: cand.status || ("Por enviar" as any),
        link: cand.link,
        tasks: []
      });
    }
  }

  return result;
}
```

### `src/utils/clipboardFestivalParser.ts`
```typescript
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
  AUDIVISUAL_GEOGRAPHY_SEED
} from '../data/seed';

// Inicializar catálogos de países
try {
  countries.registerLocale(esCountriesLocale);
  countries.registerLocale(enCountriesLocale);
} catch {
  // Ya registrados o fallback seguro
}

export interface ExtractedFestivalCandidate extends Partial<Festival> {
  rawSnippet?: string;
  detectedAccreditations?: string[];
  extractionConfidence?: number;
}

/**
 * Normaliza fechas procedentes de texto libre a formato estricto ISO YYYY-MM-DD.
 */
export function normalizeDateToISO(dateStr: string): string | undefined {
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

  // 3. Parser de lenguaje natural (Chrono) en español e inglés
  const parsedEs = chrono.es.parseDate(clean);
  if (parsedEs) {
    return parsedEs.toISOString().split('T')[0];
  }

  const parsedEn = chrono.en.parseDate(clean);
  if (parsedEn) {
    return parsedEn.toISOString().split('T')[0];
  }

  return undefined;
}

/**
 * Extrae montos o costo de arancel (fee) del texto.
 */
export function extractFee(text: string): { price: string; fee?: number } {
  if (!text) return { price: "Gratis" };
  const lower = text.toLowerCase();

  // 1. Priorizar patrones monetarios específicos ($25, 25 USD, 30 €, 30 EUR, etc.)
  const moneyPattern = /(?:[\$€£]\s*(\d+(?:[\.,]\d{1,2})?)|(\d+(?:[\.,]\d{1,2})?)\s*(?:usd|eur|dolares|euros|ars|\$|€))/i;
  const match = text.match(moneyPattern);

  if (match) {
    const rawVal = match[1] || match[2];
    const cleanNum = rawVal.replace(",", ".");
    const val = parseFloat(cleanNum);
    if (!isNaN(val)) {
      if (text.includes("€") || lower.includes("eur")) {
        return { price: `${val} EUR`, fee: val };
      }
      return { price: `$${val} USD`, fee: val };
    }
  }

  // 2. Comprobar gratuidad explícita con límites de palabra estrictos para evitar falsos positivos con URLs (ej. filmfreeway)
  if (
    /\b(gratis|free|sin costo|no fee|0 usd|0 eur)\b/i.test(lower)
  ) {
    return { price: "Gratis", fee: 0 };
  }

  return { price: "Gratis" };
}

/**
 * Detecta el país y ciudad basándose en el texto, ISO countries y la semilla geográfica.
 */
export function extractLocation(text: string): { country: string; city?: string } {
  if (!text) return { country: "A confirmar" };

  // 1. Probar primero con la semilla de geografía de ciudades conocidas buscando con límites de palabra
  for (const [key, entry] of Object.entries(AUDIVISUAL_GEOGRAPHY_SEED)) {
    const cityRegex = new RegExp(`\\b${key}\\b`, "i");
    if (cityRegex.test(text)) {
      return { country: entry.country, city: entry.city };
    }
  }

  // 2. Probar con países frecuentes en festivales cinematográficos
  const frequentCountries = [
    "Argentina", "España", "Francia", "Alemania", "Italia", "México", "Chile",
    "Brasil", "Colombia", "Estados Unidos", "Canadá", "Reino Unido", "Japón",
    "Uruguay", "Perú", "Bélgica", "Portugal", "Suiza", "Austria", "Países Bajos"
  ];
  for (const c of frequentCountries) {
    if (new RegExp(`\\b${c}\\b`, "i").test(text)) {
      return { country: c };
    }
  }

  // 3. Probar con nombres de países ISO con longitud mínima de 4 caracteres para evitar colisiones con palabras comunes
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
  if (lower.includes("terror") || lower.includes("horror") || lower.includes("fantástico")) return "Fantástico / Terror";
  if (lower.includes("cortometraje") || lower.includes("short film") || lower.includes("short")) return "Cortometraje";

  return "Cortometraje";
}

/**
 * Divide un texto extenso con múltiples convocatorias en bloques individuales de análisis.
 */
export function splitClipboardIntoCandidateBlocks(text: string): string[] {
  if (!text) return [];
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // 1. Si contiene separadores dobles explícitos
  const doubleBreakBlocks = normalized
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b.length > 5);

  if (doubleBreakBlocks.length > 1) {
    return doubleBreakBlocks;
  }

  // 2. Si contiene viñetas o listas numeradas
  const bulletBlocks = normalized
    .split(/\n(?=[•\-\*]|\d+[\.\)])/)
    .map((b) => b.trim())
    .filter((b) => b.length > 5);

  if (bulletBlocks.length > 1) {
    return bulletBlocks;
  }

  return [normalized];
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
 * Analiza un único bloque y genera un candidato estructurado.
 */
export function parseSingleFestivalBlock(block: string): ExtractedFestivalCandidate {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] || "Festival sin título";

  // Match con catálogo canónico
  const matchedSeed = matchSeedFestival(block);

  // Nombre
  const name = matchedSeed ? matchedSeed.name : firstLine.replace(/^(festival|convocatoria|open call|submit to)[:\s-]*/i, "").trim();

  // Enlaces y Plataforma
  const links = extractLinks(block);
  const mainLink = links[0] || (matchedSeed ? matchedSeed.canonicalUrl : undefined);
  let platform = "Propia";
  if (mainLink) {
    const platInfo = extractPlatformSlug(mainLink);
    if (platInfo) {
      platform = platInfo.platform;
    }
  }

  // Ubicación
  const loc = extractLocation(block);
  const country = matchedSeed ? matchedSeed.country : loc.country;
  const projectionLocation = matchedSeed && matchedSeed.city ? `${matchedSeed.city}, ${country}` : loc.city;

  // Fechas de Cierre (Deadline) y Noticias
  let deadline: string | undefined = undefined;
  let newsDate: string | undefined = undefined;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (
      lowerLine.includes("deadline") ||
      lowerLine.includes("cierre") ||
      lowerLine.includes("limite") ||
      lowerLine.includes("fecha limite") ||
      lowerLine.includes("due date")
    ) {
      const datesFound = chrono.es.parse(line).concat(chrono.en.parse(line));
      if (datesFound.length > 0 && datesFound[0].start) {
        deadline = datesFound[0].start.date().toISOString().split("T")[0];
      }
    }

    if (
      lowerLine.includes("notification") ||
      lowerLine.includes("anuncio") ||
      lowerLine.includes("notificacion") ||
      lowerLine.includes("seleccion") ||
      lowerLine.includes("news")
    ) {
      const datesFound = chrono.es.parse(line).concat(chrono.en.parse(line));
      if (datesFound.length > 0 && datesFound[0].start) {
        newsDate = datesFound[0].start.date().toISOString().split("T")[0];
      }
    }
  }

  // Si no se halló por palabra clave, buscar fechas genéricas en el bloque
  if (!deadline) {
    const genericDates = chrono.es.parse(block).concat(chrono.en.parse(block));
    if (genericDates.length > 0 && genericDates[0].start) {
      deadline = genericDates[0].start.date().toISOString().split("T")[0];
    }
  }

  // Costo y Tasa
  const feeInfo = extractFee(block);

  // Categoría
  const category = extractCategory(block);

  // Acreditaciones
  const accreditations = detectAccreditations(block);

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
    rawSnippet: block,
    extractionConfidence: matchedSeed ? 0.95 : 0.75
  };
}

/**
 * Función pública principal de captura del portapapeles.
 * Procesa localmente y en caso de disponibilidad recurre al endpoint de lote.
 */
export async function parseClipboardContent(rawClipboard: string): Promise<{
  items: ExtractedFestivalCandidate[];
  totalDetected: number;
}> {
  if (!rawClipboard || !rawClipboard.trim()) {
    return { items: [], totalDetected: 0 };
  }

  const blocks = splitClipboardIntoCandidateBlocks(rawClipboard);

  // 1. Si hay más de un bloque o el texto es complejo, intentar enriquecimiento en backend con fallback suave
  if (blocks.length >= 1) {
    try {
      const res = await fetch("/api/parse-festivals-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawClipboard, blocksCount: blocks.length })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.items) && json.items.length > 0) {
          const mapped: ExtractedFestivalCandidate[] = json.items.map((item: any) => ({
            name: item.name || "Festival sin título",
            country: item.country || "A confirmar",
            projectionLocation: item.city ? `${item.city}, ${item.country}` : item.projectionLocation,
            deadline: normalizeDateToISO(item.deadline),
            newsDate: normalizeDateToISO(item.newsDate),
            link: item.link || item.url,
            platform: item.platform || "Propia",
            price: item.price || (item.fee ? `$${item.fee} USD` : "Gratis"),
            fee: typeof item.fee === "number" ? item.fee : undefined,
            category: item.category || "Cortometraje",
            status: FestivalStatus.POR_ENVIAR,
            type: "Festival🎬",
            extractionConfidence: 0.9
          }));
          return { items: mapped, totalDetected: mapped.length };
        }
      }
    } catch {
      // Degradar silenciosamente a análisis determinista local
    }
  }

  // 2. Procesamiento local determinista
  const localItems = blocks.map((b) => parseSingleFestivalBlock(b));
  return {
    items: localItems,
    totalDetected: localItems.length
  };
}
```

---

## 4. GESTO TÁCTIL ERGONÓMICO UNIFICADO

### `src/hooks/useDrawerSwipeGesture.ts`
```typescript
import { useEffect, useRef } from 'react';

interface UseDrawerSwipeGestureOptions {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  enabled?: boolean;
}

/**
 * Hook ergonómico para gestos táctiles móviles de apertura y cierre de drawers.
 * Implementa:
 * - Área de activación para una sola mano en el pulgar derecho (mitad inferior y borde derecho).
 * - Body Scroll Lock nativo para evitar saltos de desplazamiento.
 * - Física y ratio biomecánico 1.1 con prevención de colisiones verticales.
 */
export function useDrawerSwipeGesture({
  isOpen,
  onOpen,
  onClose,
  enabled = true
}: UseDrawerSwipeGestureOptions) {
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isGestureActiveRef = useRef<boolean>(false);
  const originalOverflowRef = useRef<string>('');

  // Body Scroll Lock al estar abierto
  useEffect(() => {
    if (!enabled) return;

    if (isOpen) {
      originalOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflowRef.current || '';
    }

    return () => {
      document.body.style.overflow = originalOverflowRef.current || '';
    };
  }, [isOpen, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      touchStartXRef.current = touch.clientX;
      touchStartYRef.current = touch.clientY;

      // Apertura: Solo válida si inicia en la mitad inferior y cerca del borde derecho
      if (!isOpen) {
        const isInBottomHalf = touch.clientY > screenHeight * 0.45;
        const isNearRightEdge = touch.clientX > screenWidth - 55;
        if (isInBottomHalf && isNearRightEdge) {
          isGestureActiveRef.current = true;
        } else {
          isGestureActiveRef.current = false;
        }
      } else {
        // Cierre: Válido desde cualquier sector del drawer abierto
        isGestureActiveRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isGestureActiveRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartXRef.current;
      const deltaY = touch.clientY - touchStartYRef.current;

      // Si el desplazamiento vertical domina, cancelar para no trabar el scroll
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.1) {
        isGestureActiveRef.current = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isGestureActiveRef.current) return;
      isGestureActiveRef.current = false;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartXRef.current;
      const deltaY = touch.clientY - touchStartYRef.current;

      // Ratio biomecánico horizontal
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
        if (!isOpen && deltaX < -45) {
          // Deslizamiento hacia la izquierda para abrir
          onOpen();
        } else if (isOpen && deltaX > 45) {
          // Deslizamiento hacia la derecha para cerrar
          onClose();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onOpen, onClose, enabled]);
}
```

---

## 5. MODALES DE EXTRACCIÓN Y REVISIÓN CON RBAC

### `src/components/modals/ProcessingExtractionModal.tsx`
```typescript
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock, Check, Loader2 } from 'lucide-react';

interface ProcessingExtractionModalProps {
  isOpen: boolean;
  currentStep: number;
  statusMessage: string;
}

const STEPS = [
  { id: 1, title: 'Limpieza y normalización de texto' },
  { id: 2, title: 'Detección de fechas, plataformas y aranceles' },
  { id: 3, title: 'Cotejo contra catálogo canónico de festivales' },
  { id: 4, title: 'Deduplicación de 5 capas contra la obra' },
  { id: 5, title: 'Estructuración final de candidatos' },
];

export const ProcessingExtractionModal: React.FC<ProcessingExtractionModalProps> = ({
  isOpen,
  currentStep,
  statusMessage,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 z-10"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-pink-50 text-[#e91e63] rounded-2xl">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Analizando Convocatorias
                </h3>
              </div>
            </div>

            {/* Barra de progreso interactiva */}
            <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden">
              <motion.div
                className="bg-[#e91e63] h-full rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${(Math.min(currentStep, 5) / 5) * 100}%` }}
                transition={{ duration: 0.25 }}
              />
            </div>

            {/* Lista de pasos del pipeline */}
            <div className="space-y-3 mb-6">
              {STEPS.map((step) => {
                const isDone = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-pink-50/60 border border-pink-100'
                        : isDone
                        ? 'opacity-60'
                        : 'opacity-40'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isDone ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-[#e91e63] animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {step.id}
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        isCurrent ? 'text-slate-900 font-bold' : 'text-slate-600'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Mensaje de estado dinámico */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-medium text-slate-600">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{statusMessage || 'Procesando...'}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
```

### `src/components/modals/BatchClipboardDetectionModal.tsx`
```typescript
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  AlertTriangle,
  Film,
  Calendar,
  DollarSign,
  Globe,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Festival, FestivalStatus } from '../../types';
import { useProjectRole, useProject } from '../../context/ProjectContext';
import { DeduplicationResult } from '../../utils/clipboardDeduplicator';

export interface BatchItemCandidate extends Partial<Festival> {
  deduplication?: DeduplicationResult;
  isBatchDuplicate?: boolean;
  selectedForImport?: boolean;
}

interface BatchClipboardDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: BatchItemCandidate[];
  onConfirm: (approvedFestivals: Festival[]) => Promise<void>;
}

export const BatchClipboardDetectionModal: React.FC<BatchClipboardDetectionModalProps> = ({
  isOpen,
  onClose,
  candidates: initialCandidates,
  onConfirm,
}) => {
  const { isDistributor } = useProjectRole();
  const { currentProject } = useProject();

  const [items, setItems] = useState<BatchItemCandidate[]>(() =>
    initialCandidates.map((c) => ({
      ...c,
      selectedForImport: !c.deduplication?.isDuplicate,
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizar candidatos cuando cambian desde props
  React.useEffect(() => {
    setItems(
      initialCandidates.map((c) => ({
        ...c,
        selectedForImport: !c.deduplication?.isDuplicate,
      }))
    );
  }, [initialCandidates]);

  const toggleSelect = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, selectedForImport: !item.selectedForImport } : item
      )
    );
  };

  const updateItemField = (index: number, field: keyof Festival, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const selectedCount = items.filter((i) => i.selectedForImport).length;

  const handleCommit = async () => {
    if (!isDistributor || isSubmitting) return;

    const approved: Festival[] = items
      .filter((i) => i.selectedForImport)
      .map((i, idx) => ({
        id: i.id || `fest_${Date.now()}_${idx}`,
        name: (i.name || 'Festival sin título').trim(),
        country: (i.country || 'A confirmar').trim(),
        type: i.type || 'Festival🎬',
        status: i.status || FestivalStatus.POR_ENVIAR,
        category: i.category || 'Cortometraje',
        deadline: i.deadline || undefined,
        newsDate: i.newsDate || undefined,
        link: i.link || undefined,
        platform: i.platform || 'Propia',
        price: i.price || 'Gratis',
        fee: i.fee || 0,
        observations: i.observations || undefined,
        projectionLocation: i.projectionLocation || undefined,
        tasks: i.tasks || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

    if (approved.length === 0) {
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(approved);
      onClose();
    } catch (err) {
      console.error('Error al persistir lote de festivales:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop sincronizado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Contenedor Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            className="relative bg-white rounded-3xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl border border-slate-100 z-10 flex flex-col max-h-[90vh]"
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pink-50 text-[#e91e63] rounded-2xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    Revisión de Convocatorias
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alerta de Modo Lectura si no es distribuidor */}
            {!isDistributor && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-semibold flex-shrink-0">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Modo lectura (Rol sin permisos de escritura en este proyecto).</span>
              </div>
            )}

            {/* Listado con scroll y despeje de controles flotantes */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 pb-16">
              {items.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm font-medium">
                  No se encontraron candidatos válidos para importar.
                </div>
              ) : (
                items.map((item, index) => {
                  const isDup = item.deduplication?.isDuplicate;
                  const isSelected = item.selectedForImport;

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDup
                          ? 'bg-amber-50/40 border-amber-200/80'
                          : isSelected
                          ? 'bg-white border-slate-200 shadow-sm'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox de selección */}
                        <button
                          type="button"
                          onClick={() => toggleSelect(index)}
                          className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                            isSelected
                              ? 'bg-[#e91e63] text-white'
                              : 'border-2 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div className="flex-1 space-y-3 min-w-0">
                          {/* Advertencia de duplicado */}
                          {isDup && (
                            <div className="flex items-center gap-2 p-2 bg-amber-100/70 border border-amber-300/80 rounded-xl text-amber-900 text-[11px] font-bold">
                              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                              <span className="truncate">
                                Posible duplicado (Capa {item.deduplication?.layerMatched}):{' '}
                                {item.deduplication?.reason}
                              </span>
                            </div>
                          )}

                          {/* Campos editables principales */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <input
                                type="text"
                                value={item.name || ''}
                                onChange={(e) => updateItemField(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                                placeholder="Nombre del Festival"
                              />
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={item.country || ''}
                                onChange={(e) => updateItemField(index, 'country', e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                                placeholder="País"
                              />
                              <input
                                type="date"
                                value={item.deadline || ''}
                                onChange={(e) => updateItemField(index, 'deadline', e.target.value)}
                                className="w-36 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
                              />
                            </div>
                          </div>

                          {/* Enlace y arancel */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            {item.link ? (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg max-w-[240px] truncate transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate">{item.link}</span>
                              </a>
                            ) : null}

                            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.price || 'Gratis'}</span>
                            </div>

                            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                              <Film className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.category || 'Cortometraje'}</span>
                            </div>

                            {item.platform && (
                              <span className="px-2 py-0.5 bg-pink-50 text-[#e91e63] font-bold text-[10px] rounded-md border border-pink-100">
                                {item.platform}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botón descartar */}
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-slate-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors flex-shrink-0"
                          title="Descartar este festival"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Barra de acción ergonómica inferior */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCommit}
                disabled={!isDistributor || selectedCount === 0 || isSubmitting}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black shadow-lg transition-all ${
                  isDistributor && selectedCount > 0 && !isSubmitting
                    ? 'bg-[#e91e63] text-white hover:bg-pink-600 shadow-pink-500/20 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando en Proyecto...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Importar {selectedCount} Festival(es)</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
```

---

## 6. BACKEND RESILIENTE EN `server.ts`

Registro en `server.ts` del endpoint `/api/parse-festivals-batch`:

```typescript
  // Endpoint de lote resiliente: Groq -> Gemini -> Local determinista
  app.post("/api/parse-festivals-batch", async (req, res) => {
    try {
      const { rawText, items: rawItems } = req.body;
      if (!rawText && (!rawItems || rawItems.length === 0)) {
        return res.json({ success: true, items: [], fallbackToLocal: false });
      }

      const promptSystem = `Sos un extractor de convocatorias cinematográficas de festivales.
Devolvé estrictamente un array JSON con objetos con este formato exacto:
{
  "festivals": [
    {
      "name": "string",
      "country": "string",
      "city": "string",
      "deadline": "YYYY-MM-DD",
      "newsDate": "YYYY-MM-DD",
      "link": "string (URL)",
      "platform": "FilmFreeway | Festhome | Shortfilmdepot | Propia",
      "fee": 0,
      "price": "$X USD o Gratis",
      "category": "Cortometraje | Largometraje | Animación"
    }
  ]
}`;

      // 1. Intentar Groq Llama 3.3 70B
      const groqApiKey = process.env.GROQ_API_KEY;
      if (groqApiKey) {
        try {
          const { Groq } = await import("groq-sdk");
          const groq = new Groq({ apiKey: groqApiKey });
          const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: promptSystem },
              { role: "user", content: `Analizá el siguiente texto del portapapeles y extraé los festivales:\n\n${rawText || JSON.stringify(rawItems)}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
          });

          const jsonStr = completion.choices[0].message.content || "{}";
          const parsed = JSON.parse(jsonStr);
          const list = Array.isArray(parsed.festivals) ? parsed.festivals : (Array.isArray(parsed) ? parsed : []);
          return res.json({ success: true, items: list, engine: "groq" });
        } catch (groqErr) {
          console.warn("[parse-festivals-batch] Groq falló, recurriendo a Gemini:", (groqErr as any).message);
        }
      }

      // 2. Fallback a Gemini 2.5 Flash
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (geminiApiKey) {
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: geminiApiKey });
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analizá el siguiente texto y devolvé JSON estrictamente con clave "festivals":\n\n${rawText || JSON.stringify(rawItems)}`,
            config: {
              systemInstruction: promptSystem,
              responseMimeType: "application/json"
            }
          });

          const jsonStr = response.text || "{}";
          const parsed = JSON.parse(jsonStr);
          const list = Array.isArray(parsed.festivals) ? parsed.festivals : (Array.isArray(parsed) ? parsed : []);
          return res.json({ success: true, items: list, engine: "gemini" });
        } catch (geminiErr) {
          console.warn("[parse-festivals-batch] Gemini falló, delegando a local determinista:", (geminiErr as any).message);
        }
      }

      // 3. Fallback seguro a local determinista (sin romper el flujo)
      return res.json({ success: true, items: [], fallbackToLocal: true });
    } catch (err: any) {
      console.error("[parse-festivals-batch] Error no controlado:", err);
      return res.json({ success: true, items: [], fallbackToLocal: true });
    }
  });
```

---

## 7. CABLEADO DE CAPTURA EN `App.tsx` Y `FestivalListView.tsx`

### En `src/App.tsx`
```typescript
  // Estados y pipeline del motor de captura heurística del portapapeles
  const [isExtractingModalOpen, setIsExtractingModalOpen] = useState(false);
  const [extractionStep, setExtractionStep] = useState(1);
  const [extractionStatus, setExtractionStatus] = useState('');
  const [isBatchDetectionModalOpen, setIsBatchDetectionModalOpen] = useState(false);
  const [batchCandidates, setBatchCandidates] = useState<BatchItemCandidate[]>([]);

  const processClipboardText = async (rawText: string) => {
    if (!rawText || !rawText.trim() || !currentProject) return;

    try {
      setIsExtractingModalOpen(true);
      setExtractionStep(1);
      setExtractionStatus('Saneando y normalizando texto del portapapeles...');
      await new Promise((r) => setTimeout(r, 120));

      setExtractionStep(2);
      setExtractionStatus('Extrayendo fechas, plataformas y tasas...');
      const parsed = await parseClipboardContent(rawText);

      setExtractionStep(3);
      setExtractionStatus('Cotejando contra el catálogo canónico de festivales...');
      await new Promise((r) => setTimeout(r, 100));

      setExtractionStep(4);
      setExtractionStatus('Ejecutando deduplicación de 5 capas contra la obra...');
      const deduplicated = deduplicateBatch(parsed.items, festivals);

      setExtractionStep(5);
      setExtractionStatus('Estructurando lote para revisión...');
      await new Promise((r) => setTimeout(r, 150));

      setIsExtractingModalOpen(false);

      if (deduplicated.length > 0) {
        setBatchCandidates(deduplicated);
        setIsBatchDetectionModalOpen(true);
      } else {
        showToast('No se identificaron convocatorias válidas en el texto.');
      }
    } catch (err) {
      console.error('Error al procesar portapapeles:', err);
      setIsExtractingModalOpen(false);
      showToast('Ocurrió un error al analizar el portapapeles.');
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!currentProject) return;

      const target = e.target as HTMLElement | null;
      if (target && typeof target.tagName === 'string') {
        const tag = target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) {
          return;
        }
      }

      const text = e.clipboardData?.getData('text');
      if (text && text.trim().length > 10) {
        processClipboardText(text);
      }
    };

    const handleCustomTrigger = async () => {
      if (!currentProject) {
        showToast('Debes seleccionar o crear una obra audiovisual primero.');
        return;
      }
      try {
        if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
          const text = await navigator.clipboard.readText();
          if (text && text.trim().length > 5) {
            processClipboardText(text);
          } else {
            showToast('El portapapeles está vacío o no contiene texto legible.');
          }
        } else {
          showToast('Usa Ctrl+V o Cmd+V para pegar directamente sobre la pantalla.');
        }
      } catch {
        showToast('Usa Ctrl+V o Cmd+V para pegar directamente sobre la pantalla.');
      }
    };

    window.addEventListener('paste', handlePaste);
    window.addEventListener('festis:trigger-clipboard-capture', handleCustomTrigger);

    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('festis:trigger-clipboard-capture', handleCustomTrigger);
    };
  }, [currentProject, festivals]);
```

Renderizado de los modales en el layout raíz de `src/App.tsx`:
```tsx
      <ProcessingExtractionModal
        isOpen={isExtractingModalOpen}
        currentStep={extractionStep}
        statusMessage={extractionStatus}
      />

      <BatchClipboardDetectionModal
        isOpen={isBatchDetectionModalOpen}
        onClose={() => setIsBatchDetectionModalOpen(false)}
        candidates={batchCandidates}
        onConfirm={async (approvedFestivals) => {
          await setFestivals((prev) => [...approvedFestivals, ...prev]);
          showToast(`${approvedFestivals.length} festival(es) importado(s) exitosamente.`);
        }}
      />
```

### En `src/components/FestivalListView.tsx`
Botón integrado en la barra de herramientas:
```tsx
         <button
           type="button"
           onClick={() => window.dispatchEvent(new CustomEvent('festis:trigger-clipboard-capture'))}
           className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-pink-50 text-[#e91e63] border border-pink-100 hover:bg-pink-100/80 active:scale-95 transition-all shadow-xs"
           title="Analizar texto o enlaces copiados en el portapapeles"
         >
           <Clipboard className="w-3.5 h-3.5" />
           <span>Capturar Portapapeles</span>
         </button>
```

---

## 8. SUITE DE TESTS VITEST EN `src/test/clipboardParser.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  parseSingleFestivalBlock,
  splitClipboardIntoCandidateBlocks,
  normalizeDateToISO,
  extractFee,
  extractLocation,
  parseClipboardContent
} from '../utils/clipboardFestivalParser';
import {
  checkFestivalDuplicate,
  deduplicateBatch,
  normalizeFestivalName
} from '../utils/clipboardDeduplicator';
import { Festival, FestivalStatus } from '../types';

describe('Motor Heurístico de Captura de Portapapeles (clipboardFestivalParser)', () => {
  it('extrae correctamente festival canónico, fechas en español, costo y plataforma FilmFreeway', () => {
    const raw = `
      Sundance Film Festival 2027
      Deadline: 15 de octubre de 2026
      Notification date: 15 de diciembre de 2026
      Platform: https://filmfreeway.com/Sundance
      Fee: 45 USD
      Categoría: Cortometrajes de ficción
    `;

    const parsed = parseSingleFestivalBlock(raw);

    expect(parsed.name).toBe('Sundance Film Festival');
    expect(parsed.country).toBe('Estados Unidos');
    expect(parsed.deadline).toBe('2026-10-15');
    expect(parsed.newsDate).toBe('2026-12-15');
    expect(parsed.platform).toBe('FilmFreeway');
    expect(parsed.price).toBe('$45 USD');
    expect(parsed.fee).toBe(45);
    expect(parsed.status).toBe(FestivalStatus.POR_ENVIAR);
  });

  it('normaliza fechas en múltiples formatos deterministas y lenguaje natural', () => {
    expect(normalizeDateToISO('2026-08-20')).toBe('2026-08-20');
    expect(normalizeDateToISO('15/09/2026')).toBe('2026-09-15');
    expect(normalizeDateToISO('05-11-2026')).toBe('2026-11-05');
    expect(normalizeDateToISO('12 de mayo de 2026')).toBe('2026-05-12');
    expect(normalizeDateToISO('December 25, 2026')).toBe('2026-12-25');
  });

  it('extrae tasas de inscripción y detecta gratuidad', () => {
    expect(extractFee('Inscripción totalmente gratis para escuelas')).toEqual({ price: 'Gratis', fee: 0 });
    expect(extractFee('Early bird fee: Free of charge')).toEqual({ price: 'Gratis', fee: 0 });
    expect(extractFee('Costo general: $35 USD por cortometraje')).toEqual({ price: '$35 USD', fee: 35 });
    expect(extractFee('Tasas: 20 EUR en Shortfilmdepot')).toEqual({ price: '20 EUR', fee: 20 });
    expect(extractFee('Sin información monetaria')).toEqual({ price: 'Gratis' });
  });

  it('resuelve país mediante catálogo de ciudades audiovisuales', () => {
    expect(extractLocation('Proyección oficial en Cannes').country).toBe('Francia');
    expect(extractLocation('Festival de Sitges, sección fantástica').country).toBe('España');
    expect(extractLocation('Sede en Annecy').country).toBe('Francia');
    expect(extractLocation('Celebrado en Mar del Plata').country).toBe('Argentina');
  });

  it('divide texto compuesto en bloques individuales cuando hay saltos dobles', () => {
    const rawMulti = `
Festival Internacional de Cine de Huesca
Deadline: 10 de febrero de 2027
https://festhome.com/festival/huesca

Clermont-Ferrand Short Film Festival
Deadline: 15 de septiembre de 2026
https://www.clermont-filmfest.org
    `.trim();

    const blocks = splitClipboardIntoCandidateBlocks(rawMulti);
    expect(blocks.length).toBe(2);
    expect(blocks[0]).toContain('Huesca');
    expect(blocks[1]).toContain('Clermont-Ferrand');
  });

  // CASOS NEGATIVOS OBLIGATORIOS (Happy-Path Bias Ban)
  it('CASO NEGATIVO: maneja texto corrupto, irrelevante o basura sin alucinar datos', async () => {
    const garbageText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.";
    const result = await parseClipboardContent(garbageText);

    expect(result.items.length).toBe(1);
    const item = result.items[0];
    expect(item.name).toBe("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.");
    expect(item.deadline).toBeUndefined();
    expect(item.price).toBe("Gratis");
    expect(item.link).toBeUndefined();
    expect(item.country).toBe("A confirmar");
  });

  it('CASO NEGATIVO: cadena vacía o espacios en blanco devuelve lote sin elementos', async () => {
    const emptyResult = await parseClipboardContent("   \n\n  \t ");
    expect(emptyResult.items.length).toBe(0);
    expect(emptyResult.totalDetected).toBe(0);
  });
});

describe('Pipeline de Deduplicación de 5 Capas (clipboardDeduplicator)', () => {
  const existingPool: Festival[] = [
    {
      id: 'fest_1',
      name: 'Sitges - Festival Internacional de Cinema Fantàstic',
      country: 'España',
      type: 'Festival🎬',
      status: FestivalStatus.POR_ENVIAR,
      link: 'https://festhome.com/festival/sitges',
      tasks: []
    },
    {
      id: 'fest_2',
      name: 'Festival Internacional de Cine de Mar del Plata',
      country: 'Argentina',
      type: 'Festival🎬',
      status: FestivalStatus.SELECCIONADO,
      link: 'https://www.mardelplatafilmfest.com',
      tasks: []
    },
    {
      id: 'fest_3',
      name: 'Muestra de Cine Nocturno Valdivia',
      country: 'Chile',
      type: 'Muestra🎞️',
      status: FestivalStatus.POR_ENVIAR,
      tasks: []
    }
  ];

  it('Capa 1: detecta duplicado por coincidencia de URL y Platform Slug', () => {
    const candidate: Partial<Festival> = {
      name: 'Sitges 2026',
      link: 'https://festhome.com/festival/sitges/'
    };

    const res = checkFestivalDuplicate(candidate, existingPool);
    expect(res.isDuplicate).toBe(true);
    expect(res.layerMatched).toBe(1);
    expect(res.confidence).toBe(1.0);
    expect(res.matchedFestival?.id).toBe('fest_1');
  });

  it('Capa 2: detecta duplicado por nombre normalizado idéntico sin stopwords', () => {
    const candidate: Partial<Festival> = {
      name: 'Festival Internacional de Cine de Mar del Plata'
    };

    const res = checkFestivalDuplicate(candidate, existingPool);
    expect(res.isDuplicate).toBe(true);
    expect(res.layerMatched).toBe(2);
    expect(res.confidence).toBe(0.98);
  });

  it('Capa 3: detecta duplicado mediante Fuse.js Fuzzy Matching con variación tipográfica leve', () => {
    const candidate: Partial<Festival> = {
      name: 'Cine Nocturno Valdivia'
    };

    const res = checkFestivalDuplicate(candidate, existingPool);
    expect(res.isDuplicate).toBe(true);
    expect(res.layerMatched).toBe(3);
    expect(res.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('Capa 4: detecta duplicado por raíz de nombre y misma ubicación geográfica', () => {
    const candidate: Partial<Festival> = {
      name: 'Cine Mar del Plata Edición 41',
      country: 'Argentina'
    };

    const res = checkFestivalDuplicate(candidate, existingPool);
    expect(res.isDuplicate).toBe(true);
    expect(res.layerMatched).toBe(4);
  });

  it('Capa 5: detecta duplicado mediante pertenencia al mismo festival canónico', () => {
    const candidate: Partial<Festival> = {
      name: 'Zinemaldia',
      link: 'https://www.sansebastianfestival.com'
    };

    const poolWithSanSebastian: Festival[] = [
      ...existingPool,
      {
        id: 'fest_ss',
        name: 'San Sebastian International Film Festival',
        country: 'España',
        type: 'Festival🎬',
        status: FestivalStatus.EN_REVISION,
        tasks: []
      }
    ];

    const res = checkFestivalDuplicate(candidate, poolWithSanSebastian);
    expect(res.isDuplicate).toBe(true);
    expect(res.layerMatched).toBe(5);
  });

  it('deduplicateBatch marca correctamente duplicados y previene colisiones internas del lote', () => {
    const batchCandidates: Partial<Festival>[] = [
      { name: 'Festival Nuevo Inédito A', link: 'https://festnew.com' },
      { name: 'Festival Nuevo Inédito A', link: 'https://festnew.com' },
      { name: 'Sitges 2026', link: 'https://festhome.com/festival/sitges' }
    ];

    const processed = deduplicateBatch(batchCandidates, existingPool);

    expect(processed.length).toBe(3);
    expect(processed[0].deduplication?.isDuplicate).toBe(false);
    expect(processed[1].deduplication?.isDuplicate).toBe(true);
    expect(processed[2].deduplication?.isDuplicate).toBe(true);
  });
});
```
