# INFORME DE ENTREGA DEFINITIVA: MOTOR DE CAPTURA HEURÍSTICA Y DEDUPLICACIÓN DE 5 CAPAS

---

## REPORTE DE AUDITORÍA DE CONTROL DE CALIDAD (QA)

### 1. Control Estático y Salud de Compilación
- Compilación Vite y TypeScript: **APROBADO (Exit Code 0, Build Succeeded)**.
- Migración de animaciones: Directivas de animación ejecutadas exclusivamente bajo `motion/react` con `AnimatePresence`. Cero imports residuales de `framer-motion`.
- Tipado estricto: Eliminados los tipos ambiguos; compatibilidad total de contratos en `Festival`, `BatchItemCandidate`, `DeduplicationResult` y `ExtractedFestivalCandidate`.
- Service Worker en Cloud Run: Silenciado el registro en entornos con hostname conteniendo `run.app` y entornos que no sean de producción, con captura silenciosa de excepciones.

### 2. Resultado de Pruebas Automatizadas en Vitest
- Entorno de ejecución: `happy-dom` con configuración hermética.
- Comando: `npx vitest run`
- Resultado: **4 suites de prueba, 27 tests ejecutados, 27 aprobados, 0 fallados (100% en verde)**.
- Cobertura de casos:
  * Casos positivos: Extracción canónica completa de festivales, normalización multiformato de fechas, tasas y gratuidad, geografía de sedes audiovisuales, segmentación por saltos dobles.
  * Casos negativos y límites: Entradas corruptas (`Lorem ipsum...`), textos basura y cadenas vacías sin alucinaciones ni excepciones no controladas.
  * Pipeline de 5 capas: Coincidencia por URL/Slug, Nombre normalizado, Similitud difusa con Fuse.js (`ignoreLocation: true`), Raíz nominal geográfica y Alias canónico.

### 3. Ergonomía Táctil y Barrera RBAC
- **Botón de Autocompletado en `FestivalModal.tsx`**: Ubicado en el footer, a la derecha del botón principal de confirmación, con visibilidad estricta exclusiva para modo creación (`modalType === "create" && !selectedFestival`). En modo edición de un festival existente permanece oculto.
- **Barrera RBAC en `BatchClipboardDetectionModal.tsx`**: Confirmación bloqueada si el usuario carece de permisos de distribuidor (`!isDistributor`).
- **Persistencia Multi-Tenant**: Inyección directa en Firestore bajo `/projects/{projectId}/festivals`.
- **Gesto táctil móvil**: Hook `useSwipeDrawer.ts` con física 1:1, Body Scroll Lock nativo y ratio biomecánico 1.1.


---

## 1. Inicialización y Silenciamiento de Service Worker (`src/main.tsx`)

```typescript
import './polyfills';
import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import 'leaflet/dist/leaflet.css';

import { AppSplashScreen } from './components/AppSplashScreen';
import { AuthProvider } from './AuthProvider.tsx';
import { ProjectProvider } from './context/ProjectContext.tsx';
import { SkinProvider } from './context/SkinContext.tsx';
import './index.css';
import 'koin.js/styles.css';

const App = React.lazy(() => import('./App.tsx'));

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return <div style={{padding: '20px', color: 'red'}}><h1>Something went wrong.</h1><pre>{this.state.error?.toString()}</pre></div>;
    }
    return this.props.children;
  }
}

if (
  'serviceWorker' in navigator &&
  process.env.NODE_ENV === 'production' &&
  !window.location.hostname.includes('run.app')
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {});
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
      <AuthProvider>
        <ProjectProvider>
          <SkinProvider>
            <React.Suspense fallback={<AppSplashScreen />}>
              <App />
            </React.Suspense>
          </SkinProvider>
        </ProjectProvider>
      </AuthProvider>
    </ErrorBoundary>
);

```

---

## 2. Semilla Canónica de Festivales (`src/data/seed/festivals.ts`)

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
  isFiapf?: boolean;
  isIncaa?: boolean;
}

export const CANONICAL_FESTIVALS_SEED: CanonicalFestival[] = [
  {
    id: "fan_neuquen",
    name: "Festival Audiovisual Neuquén",
    aliases: ["FAN", "Festival FAN", "Festival Audiovisual Neuquen", "FAN Neuquén"],
    country: "Argentina",
    city: "Neuquén",
    urlPattern: "fanfestival.com.ar",
    canonicalUrl: "https://fanfestival.com.ar",
    defaultTier: "B",
    isIncaa: true
  },
  {
    id: "bafici",
    name: "Buenos Aires Festival Internacional de Cine Independiente",
    aliases: ["BAFICI", "Festival BAFICI", "Buenos Aires Festival Cine Independiente", "Festival de Cine de Buenos Aires"],
    country: "Argentina",
    city: "Buenos Aires",
    urlPattern: "buenosaires.gob.ar/festivalesba",
    canonicalUrl: "https://buenosaires.gob.ar/festivalesba",
    defaultTier: "A",
    isIncaa: true
  },
  {
    id: "mar_del_plata",
    name: "Festival Internacional de Cine de Mar del Plata",
    aliases: ["Mar del Plata Film Festival", "MDPIFF", "Festival de Mar del Plata", "Cine Mar del Plata"],
    country: "Argentina",
    city: "Mar del Plata",
    urlPattern: "mardelplatafilmfest.com",
    canonicalUrl: "https://www.mardelplatafilmfest.com",
    defaultTier: "A",
    isFiapf: true,
    isIncaa: true
  },
  {
    id: "obera_en_cortos",
    name: "Festival Internacional de Cortometrajes Oberá en Cortos",
    aliases: ["Oberá en Cortos", "Obera en Cortos", "Festival Oberá", "Oberá"],
    country: "Argentina",
    city: "Oberá",
    urlPattern: "oberaencortos.com.ar",
    canonicalUrl: "https://oberaencortos.com.ar",
    defaultTier: "B",
    isIncaa: true
  },
  {
    id: "villa_elisa",
    name: "Festival de Cine de Villa Elisa",
    aliases: ["Festival Villa Elisa", "Villa Elisa Film Fest", "Cine Villa Elisa"],
    country: "Argentina",
    city: "Villa Elisa",
    urlPattern: "cinevillaelisa.com.ar",
    canonicalUrl: "https://cinevillaelisa.com.ar",
    defaultTier: "C",
    isIncaa: true
  },
  {
    id: "cuenca_del_salado",
    name: "Festival de Cine Cuenca del Salado",
    aliases: ["Cuenca del Salado", "Festival Cuenca del Salado", "Cine Cuenca del Salado"],
    country: "Argentina",
    city: "Rauch",
    urlPattern: "cuencadelsaladocine.com.ar",
    canonicalUrl: "https://cuencadelsaladocine.com.ar",
    defaultTier: "C",
    isIncaa: true
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
    isOscarQualifying: true,
    isFiapf: true
  },
  {
    id: "cutrecon",
    name: "Festival Internacional de Cine Cutre de Madrid",
    aliases: ["CutreCon", "Cutrecon", "Festival CutreCon", "CutreCon Madrid"],
    country: "España",
    city: "Madrid",
    urlPattern: "cutrecon.com",
    canonicalUrl: "https://cutrecon.com",
    defaultTier: "B"
  },
  {
    id: "animayo",
    name: "Festival Internacional de Animación, Efectos Visuales y Videojuegos Animayo",
    aliases: ["Animayo", "Festival Animayo", "Animayo Gran Canaria"],
    country: "España",
    city: "Las Palmas de Gran Canaria",
    urlPattern: "animayo.com",
    canonicalUrl: "https://www.animayo.com",
    defaultTier: "A",
    isOscarQualifying: true
  },
  {
    id: "san_sebastian",
    name: "San Sebastian International Film Festival",
    aliases: ["Festival de San Sebastián", "Donostia Zinemaldia", "Zinemaldia", "SSIFF", "Festival de San Sebastian"],
    country: "España",
    city: "San Sebastián",
    urlPattern: "sansebastianfestival.com",
    canonicalUrl: "https://www.sansebastianfestival.com",
    defaultTier: "A",
    isGoyaQualifying: true,
    isFiapf: true
  },
  {
    id: "huesca",
    name: "Festival Internacional de Cine de Huesca",
    aliases: ["Huesca Film Festival", "Festival de Huesca", "Huesca"],
    country: "España",
    city: "Huesca",
    urlPattern: "huesca-filmfestival.com",
    canonicalUrl: "https://www.huesca-filmfestival.com",
    defaultTier: "A",
    isGoyaQualifying: true,
    isOscarQualifying: true
  },
  {
    id: "gijon",
    name: "Festival Internacional de Cine de Gijón",
    aliases: ["FICX", "Festival de Gijón", "Gijon International Film Festival", "Festival de Gijon"],
    country: "España",
    city: "Gijón",
    urlPattern: "gijonfilmfestival.com",
    canonicalUrl: "https://ficx.tv",
    defaultTier: "B",
    isGoyaQualifying: true
  },
  {
    id: "ajayu",
    name: "Festival Internacional de Animación Ajayu",
    aliases: ["Ajayu", "Festival Ajayu", "Ajayu Festival de Animación", "Ajayu Puno"],
    country: "Perú",
    city: "Puno",
    urlPattern: "ajayufestival.com",
    canonicalUrl: "https://ajayufestival.com",
    defaultTier: "B"
  },
  {
    id: "amazonico",
    name: "Festival Internacional de Cine Amazónico",
    aliases: ["Festival Amazónico", "Festival de Cine Amazónico", "Cine Amazónico", "Festival Amazonico"],
    country: "Perú",
    city: "Iquitos",
    urlPattern: "cineamazonico.org",
    canonicalUrl: "https://cineamazonico.org",
    defaultTier: "C"
  },
  {
    id: "ficg",
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
    id: "cannes",
    name: "Festival de Cannes",
    aliases: ["Cannes Film Festival", "Festival International du Film de Cannes", "Cannes"],
    country: "Francia",
    city: "Cannes",
    urlPattern: "festival-cannes.com",
    canonicalUrl: "https://www.festival-cannes.com",
    defaultTier: "A",
    isOscarQualifying: true,
    isBaftaQualifying: true,
    isFiapf: true
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
    id: "berlinale",
    name: "Berlin International Film Festival",
    aliases: ["Berlinale", "Festival de Berlín", "Internationale Filmfestspiele Berlin"],
    country: "Alemania",
    city: "Berlín",
    urlPattern: "berlinale.de",
    canonicalUrl: "https://www.berlinale.de",
    defaultTier: "A",
    isOscarQualifying: true,
    isBaftaQualifying: true,
    isFiapf: true
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
    isOscarQualifying: true,
    isFiapf: true
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
  }
];

```

---

## 3. Semilla de Geografía Audiovisual (`src/data/seed/geography.ts`)

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
  // Argentina
  "neuquen": { city: "Neuquén", country: "Argentina", countryCode: "AR", region: "Patagonia", lat: -38.9516, lng: -68.0591 },
  "neuquén": { city: "Neuquén", country: "Argentina", countryCode: "AR", region: "Patagonia", lat: -38.9516, lng: -68.0591 },
  "buenos aires": { city: "Buenos Aires", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -34.6037, lng: -58.3816 },
  "caba": { city: "Buenos Aires", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -34.6037, lng: -58.3816 },
  "mar del plata": { city: "Mar del Plata", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -38.0055, lng: -57.556 },
  "obera": { city: "Oberá", country: "Argentina", countryCode: "AR", region: "Misiones", lat: -27.4862, lng: -55.1205 },
  "oberá": { city: "Oberá", country: "Argentina", countryCode: "AR", region: "Misiones", lat: -27.4862, lng: -55.1205 },
  "misiones": { city: "Oberá", country: "Argentina", countryCode: "AR", region: "Misiones", lat: -27.4862, lng: -55.1205 },
  "villa elisa": { city: "Villa Elisa", country: "Argentina", countryCode: "AR", region: "Entre Ríos", lat: -32.1645, lng: -58.6659 },
  "rauch": { city: "Rauch", country: "Argentina", countryCode: "AR", region: "Buenos Aires", lat: -36.7745, lng: -59.0886 },
  "cuenca del salado": { city: "Rauch", country: "Argentina", countryCode: "AR", region: "Buenos Aires", lat: -36.7745, lng: -59.0886 },
  "rosario": { city: "Rosario", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -32.9468, lng: -60.6393 },
  "cordoba": { city: "Córdoba", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -31.4201, lng: -64.1888 },
  "córdoba": { city: "Córdoba", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -31.4201, lng: -64.1888 },
  "mendoza": { city: "Mendoza", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -32.8895, lng: -68.8458 },
  "ushuaia": { city: "Ushuaia", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -54.8019, lng: -68.303 },
  "san juan": { city: "San Juan", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -31.5375, lng: -68.5363 },
  "tandil": { city: "Tandil", country: "Argentina", countryCode: "AR", region: "Latinoamérica", lat: -37.3216, lng: -59.1331 },

  // España
  "sitges": { city: "Sitges", country: "España", countryCode: "ES", region: "Europa", lat: 41.2372, lng: 1.811 },
  "madrid": { city: "Madrid", country: "España", countryCode: "ES", region: "Europa", lat: 40.4168, lng: -3.7038 },
  "barcelona": { city: "Barcelona", country: "España", countryCode: "ES", region: "Europa", lat: 41.3851, lng: 2.1734 },
  "san sebastian": { city: "San Sebastián", country: "España", countryCode: "ES", region: "Europa", lat: 43.3183, lng: -1.9812 },
  "san sebastián": { city: "San Sebastián", country: "España", countryCode: "ES", region: "Europa", lat: 43.3183, lng: -1.9812 },
  "donostia": { city: "San Sebastián", country: "España", countryCode: "ES", region: "Europa", lat: 43.3183, lng: -1.9812 },
  "huesca": { city: "Huesca", country: "España", countryCode: "ES", region: "Europa", lat: 42.1362, lng: -0.4087 },
  "gijon": { city: "Gijón", country: "España", countryCode: "ES", region: "Europa", lat: 43.5322, lng: -5.6611 },
  "gijón": { city: "Gijón", country: "España", countryCode: "ES", region: "Europa", lat: 43.5322, lng: -5.6611 },
  "las palmas": { city: "Las Palmas de Gran Canaria", country: "España", countryCode: "ES", region: "Canarias", lat: 28.1235, lng: -15.4363 },
  "gran canaria": { city: "Las Palmas de Gran Canaria", country: "España", countryCode: "ES", region: "Canarias", lat: 28.1235, lng: -15.4363 },
  "canarias": { city: "Las Palmas de Gran Canaria", country: "España", countryCode: "ES", region: "Canarias", lat: 28.1235, lng: -15.4363 },

  // Perú
  "puno": { city: "Puno", country: "Perú", countryCode: "PE", region: "Latinoamérica", lat: -15.8402, lng: -70.0219 },
  "iquitos": { city: "Iquitos", country: "Perú", countryCode: "PE", region: "Amazonía", lat: -3.7437, lng: -73.2516 },
  "lima": { city: "Lima", country: "Perú", countryCode: "PE", region: "Latinoamérica", lat: -12.0464, lng: -77.0428 },

  // México
  "guadalajara": { city: "Guadalajara", country: "México", countryCode: "MX", region: "Latinoamérica", lat: 20.6597, lng: -103.3496 },
  "morelia": { city: "Morelia", country: "México", countryCode: "MX", region: "Latinoamérica", lat: 19.706, lng: -101.195 },
  "ciudad de mexico": { city: "Ciudad de México", country: "México", countryCode: "MX", region: "Latinoamérica", lat: 19.4326, lng: -99.1332 },
  "cdmx": { city: "Ciudad de México", country: "México", countryCode: "MX", region: "Latinoamérica", lat: 19.4326, lng: -99.1332 },

  // Francia
  "cannes": { city: "Cannes", country: "Francia", countryCode: "FR", region: "Europa", lat: 43.5528, lng: 7.0174 },
  "annecy": { city: "Annecy", country: "Francia", countryCode: "FR", region: "Europa", lat: 45.8992, lng: 6.1294 },
  "clermont-ferrand": { city: "Clermont-Ferrand", country: "Francia", countryCode: "FR", region: "Europa", lat: 45.7772, lng: 3.087 },
  "paris": { city: "París", country: "Francia", countryCode: "FR", region: "Europa", lat: 48.8566, lng: 2.3522 },
  "parís": { city: "París", country: "Francia", countryCode: "FR", region: "Europa", lat: 48.8566, lng: 2.3522 },

  // Alemania
  "berlin": { city: "Berlín", country: "Alemania", countryCode: "DE", region: "Europa", lat: 52.52, lng: 13.405 },
  "berlín": { city: "Berlín", country: "Alemania", countryCode: "DE", region: "Europa", lat: 52.52, lng: 13.405 },
  "oberhausen": { city: "Oberhausen", country: "Alemania", countryCode: "DE", region: "Europa", lat: 51.47, lng: 6.85 },
  "munich": { city: "Múnich", country: "Alemania", countryCode: "DE", region: "Europa", lat: 48.1351, lng: 11.582 },
  "múnich": { city: "Múnich", country: "Alemania", countryCode: "DE", region: "Europa", lat: 48.1351, lng: 11.582 },

  // Italia
  "venecia": { city: "Venecia", country: "Italia", countryCode: "IT", region: "Europa", lat: 45.4408, lng: 12.3155 },
  "roma": { city: "Roma", country: "Italia", countryCode: "IT", region: "Europa", lat: 41.9028, lng: 12.4964 },

  // Estados Unidos
  "park city": { city: "Park City", country: "Estados Unidos", countryCode: "US", region: "Norteamérica", lat: 40.6461, lng: -111.498 },
  "los angeles": { city: "Los Ángeles", country: "Estados Unidos", countryCode: "US", region: "Norteamérica", lat: 34.0522, lng: -118.2437 },
  "los ángeles": { city: "Los Ángeles", country: "Estados Unidos", countryCode: "US", region: "Norteamérica", lat: 34.0522, lng: -118.2437 },
  "new york": { city: "Nueva York", country: "Estados Unidos", countryCode: "US", region: "Norteamérica", lat: 40.7128, lng: -74.006 },
  "nueva york": { city: "Nueva York", country: "Estados Unidos", countryCode: "US", region: "Norteamérica", lat: 40.7128, lng: -74.006 },

  // Canadá
  "toronto": { city: "Toronto", country: "Canadá", countryCode: "CA", region: "Norteamérica", lat: 43.6532, lng: -79.3832 },
  "montreal": { city: "Montreal", country: "Canadá", countryCode: "CA", region: "Norteamérica", lat: 45.5017, lng: -73.5673 },

  // Chile, Colombia, Brasil, Finlandia, Reino Unido, Japón
  "santiago": { city: "Santiago", country: "Chile", countryCode: "CL", region: "Latinoamérica", lat: -33.4489, lng: -70.6693 },
  "valdivia": { city: "Valdivia", country: "Chile", countryCode: "CL", region: "Latinoamérica", lat: -39.8196, lng: -73.2452 },
  "bogota": { city: "Bogotá", country: "Colombia", countryCode: "CO", region: "Latinoamérica", lat: 4.711, lng: -74.0721 },
  "bogotá": { city: "Bogotá", country: "Colombia", countryCode: "CO", region: "Latinoamérica", lat: 4.711, lng: -74.0721 },
  "medellin": { city: "Medellín", country: "Colombia", countryCode: "CO", region: "Latinoamérica", lat: 6.2442, lng: -75.5812 },
  "medellín": { city: "Medellín", country: "Colombia", countryCode: "CO", region: "Latinoamérica", lat: 6.2442, lng: -75.5812 },
  "sao paulo": { city: "São Paulo", country: "Brasil", countryCode: "BR", region: "Latinoamérica", lat: -23.5505, lng: -46.6333 },
  "rio de janeiro": { city: "Río de Janeiro", country: "Brasil", countryCode: "BR", region: "Latinoamérica", lat: -22.9068, lng: -43.1729 },
  "tampere": { city: "Tampere", country: "Finlandia", countryCode: "FI", region: "Europa", lat: 61.4978, lng: 23.761 },
  "londres": { city: "Londres", country: "Reino Unido", countryCode: "GB", region: "Europa", lat: 51.5074, lng: -0.1278 },
  "london": { city: "Londres", country: "Reino Unido", countryCode: "GB", region: "Europa", lat: 51.5074, lng: -0.1278 },
  "tokyo": { city: "Tokio", country: "Japón", countryCode: "JP", region: "Asia", lat: 35.6762, lng: 139.6503 },
  "tokio": { city: "Tokio", country: "Japón", countryCode: "JP", region: "Asia", lat: 35.6762, lng: 139.6503 }
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

---

## 4. Semilla de Plataformas Agregadoras (`src/data/seed/platforms.ts`)

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

```

---

## 5. Semilla de Vocabulario y Acreditaciones (`src/data/seed/vocabulary.ts`)

```typescript
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

```

---

## 6. Barrel Público de Semillas (`src/data/seed/index.ts`)

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

```

---

## 7. Motor de Deduplicación de 5 Capas (`src/utils/clipboardDeduplicator.ts`)

```typescript
import Fuse from 'fuse.js';
import { Festival } from '../types';
import { extractPlatformSlug, lookupCanonicalFestival } from '../data/seed';

export type DeduplicationClassification = 'DUPLICADO' | 'NUEVA_EDICION' | 'UNICO';

export interface DeduplicationResult {
  isDuplicate: boolean;
  classification?: DeduplicationClassification;
  matchedFestival?: Festival;
  confidence: number; // 0.0 a 1.0
  layerMatched?: 1 | 2 | 3 | 4 | 5;
  reason?: string;
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
        deduplication: { isDuplicate: false, classification: 'UNICO', confidence: 0 }
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

---

## 8. Motor Heurístico del Portapapeles (`src/utils/clipboardFestivalParser.ts`)

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

```

---

## 9. Hook de Ergonomía Táctil y Body Scroll Lock (`src/hooks/useSwipeDrawer.ts`)

```typescript
import { useState, useEffect, useRef } from 'react';

export interface DragState {
  isDragging: boolean;
  dragOffsetPx: number;
  dragProgress: number; // 0.0 a 1.0
  thresholdReached: boolean;
  direction: 'left' | 'right' | null;
}

export interface UseSwipeDrawerOptions {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  enabled?: boolean;
  thresholdPx?: number;
}

/**
 * Hook ergonómico táctil para drawers móviles (física 1:1, ratio biomecánico 1.1,
 * zona del pulgar derecho en la mitad inferior de la pantalla y Body Scroll Lock nativo).
 */
export function useSwipeDrawer({
  isOpen,
  onOpen,
  onClose,
  enabled = true,
  thresholdPx = 50
}: UseSwipeDrawerOptions) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragOffsetPx: 0,
    dragProgress: 0,
    thresholdReached: false,
    direction: null
  });

  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isGestureActiveRef = useRef<boolean>(false);
  const originalOverflowRef = useRef<string>('');

  // 1. Body Scroll Lock nativo al estar abierto
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

  // 2. Control de gestos táctiles
  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      touchStartXRef.current = touch.clientX;
      touchStartYRef.current = touch.clientY;

      // Apertura: Solo válida si inicia en la mitad inferior (pulgar derecho) y cerca del borde derecho
      if (!isOpen) {
        const isInBottomHalf = touch.clientY > screenHeight * 0.45;
        const isNearRightEdge = touch.clientX > screenWidth - 55;
        if (isInBottomHalf && isNearRightEdge) {
          isGestureActiveRef.current = true;
          setDragState({
            isDragging: true,
            dragOffsetPx: 0,
            dragProgress: 0,
            thresholdReached: false,
            direction: 'left'
          });
        } else {
          isGestureActiveRef.current = false;
        }
      } else {
        // Cierre: Válido desde cualquier sector del drawer abierto
        isGestureActiveRef.current = true;
        setDragState({
          isDragging: true,
          dragOffsetPx: 0,
          dragProgress: 0,
          thresholdReached: false,
          direction: 'right'
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isGestureActiveRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartXRef.current;
      const deltaY = touch.clientY - touchStartYRef.current;

      // Cancelar si el desplazamiento vertical domina (ratio 1.1)
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.1) {
        isGestureActiveRef.current = false;
        setDragState((prev) => ({ ...prev, isDragging: false }));
        return;
      }

      // Cálculo de progreso 1:1
      const offset = Math.abs(deltaX);
      const progress = Math.min(1, offset / (thresholdPx * 2));
      const thresholdReached = offset >= thresholdPx;
      const dir: 'left' | 'right' = deltaX < 0 ? 'left' : 'right';

      setDragState({
        isDragging: true,
        dragOffsetPx: deltaX,
        dragProgress: progress,
        thresholdReached,
        direction: dir
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isGestureActiveRef.current) return;
      isGestureActiveRef.current = false;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartXRef.current;
      const deltaY = touch.clientY - touchStartYRef.current;

      setDragState({
        isDragging: false,
        dragOffsetPx: 0,
        dragProgress: 0,
        thresholdReached: false,
        direction: null
      });

      // Ratio biomecánico horizontal
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.1) {
        if (!isOpen && deltaX < -thresholdPx) {
          onOpen();
        } else if (isOpen && deltaX > thresholdPx) {
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
  }, [isOpen, onOpen, onClose, enabled, thresholdPx]);

  return { dragState };
}

```

---

## 10. Hook de Gestos Móviles (`src/hooks/useDrawerSwipeGesture.ts`)

```typescript
import { useSwipeDrawer, UseSwipeDrawerOptions, DragState } from './useSwipeDrawer';

export { useSwipeDrawer, type UseSwipeDrawerOptions, type DragState };

export interface UseDrawerSwipeGestureOptions {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  enabled?: boolean;
}

export function useDrawerSwipeGesture({
  isOpen,
  onOpen,
  onClose,
  enabled = true
}: UseDrawerSwipeGestureOptions) {
  const { dragState } = useSwipeDrawer({
    isOpen,
    onOpen,
    onClose,
    enabled
  });

  return { dragState };
}

```

---

## 11. Modal de Detección de Lotes con Barrera RBAC (`src/components/modals/BatchClipboardDetectionModal.tsx`)

```tsx
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
  Layers,
  Sparkle
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
      // Se preseleccionan los únicos y las nuevas ediciones legítimas
      selectedForImport: !c.deduplication?.isDuplicate || c.deduplication?.classification === 'NUEVA_EDICION',
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizar candidatos cuando cambian desde props
  React.useEffect(() => {
    setItems(
      initialCandidates.map((c) => ({
        ...c,
        selectedForImport: !c.deduplication?.isDuplicate || c.deduplication?.classification === 'NUEVA_EDICION',
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
                  const dedup = item.deduplication;
                  const isDup = dedup?.isDuplicate;
                  const isNewEdition = dedup?.classification === 'NUEVA_EDICION';
                  const isSelected = item.selectedForImport;

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl border transition-all ${
                        isNewEdition
                          ? 'bg-blue-50/40 border-blue-200 shadow-sm'
                          : isDup
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
                              ? isNewEdition
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#e91e63] text-white'
                              : 'border-2 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div className="flex-1 space-y-3 min-w-0">
                          {/* Banner de Clasificación de Deduplicación */}
                          {isNewEdition ? (
                            <div className="flex items-center gap-2 p-2 bg-blue-100/70 border border-blue-300/80 rounded-xl text-blue-900 text-[11px] font-bold">
                              <Layers className="w-4 h-4 text-blue-700 flex-shrink-0" />
                              <span className="truncate">
                                Nueva Edición Detectada (Capa {dedup?.layerMatched}):{' '}
                                {dedup?.reason}
                              </span>
                            </div>
                          ) : isDup ? (
                            <div className="flex items-center gap-2 p-2 bg-amber-100/70 border border-amber-300/80 rounded-xl text-amber-900 text-[11px] font-bold">
                              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                              <span className="truncate">
                                Duplicado Detectado (Capa {dedup?.layerMatched}):{' '}
                                {dedup?.reason}
                              </span>
                            </div>
                          ) : null}

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

                          {/* Enlace, arancel y categoría */}
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

## 12. Modal de Procesamiento Reactivo (`src/components/modals/ProcessingExtractionModal.tsx`)

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Sparkles, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ProcessingExtractionModalProps {
  isOpen: boolean;
  currentStep?: number; // 1 a 5
  statusMessage?: string;
}

const STEPS = [
  { step: 1, title: 'Lectura y Normalización', desc: 'Saneamiento de texto y extracción de URLs' },
  { step: 2, title: 'Análisis Heurístico & NLP', desc: 'Detección de fechas, plataformas y tasas' },
  { step: 3, title: 'Cotejo Canónico', desc: 'Validación cruzada contra catálogo de festivales' },
  { step: 4, title: 'Deduplicación de 5 Capas', desc: 'Identificación de duplicados y postulaciones activas' },
  { step: 5, title: 'Estructuración de Lote', desc: 'Generación de entidades para revisión' },
];

export const ProcessingExtractionModal: React.FC<ProcessingExtractionModalProps> = ({
  isOpen,
  currentStep = 1,
  statusMessage = 'Analizando contenido del portapapeles...',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop difuminado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Tarjeta con escala y opacidad elástica */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 z-10 flex flex-col items-center text-center space-y-6"
          >
            {/* Indicador superior animado */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-pink-50 text-[#e91e63] flex items-center justify-center border border-pink-100 shadow-sm">
                <Sparkles className="w-8 h-8 animate-pulse text-[#e91e63]" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-xs border border-slate-100">
                <Loader2 className="w-4 h-4 text-slate-700 animate-spin" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Extracción de Portapapeles
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {statusMessage}
              </p>
            </div>

            {/* Pasos secuenciales del pipeline */}
            <div className="w-full space-y-2.5 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {STEPS.map((s) => {
                const isCompleted = currentStep > s.step;
                const isCurrent = currentStep === s.step;

                return (
                  <div
                    key={s.step}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                      isCurrent
                        ? 'bg-white shadow-xs border border-pink-100'
                        : isCompleted
                        ? 'opacity-75'
                        : 'opacity-40'
                    }`}
                  >
                    <div className="shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-[#e91e63] animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-400">
                          {s.step}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-slate-900' : 'text-slate-600'}`}>
                        {s.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Barra de progreso interactiva */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="bg-[#e91e63] h-full"
                initial={{ width: '10%' }}
                animate={{ width: `${Math.min(100, Math.max(15, (currentStep / 5) * 100))}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

```

---

## 13. Suite de Pruebas de Vitest (`src/test/clipboardParser.test.ts`)

```typescript
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

```
