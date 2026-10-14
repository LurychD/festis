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
