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
