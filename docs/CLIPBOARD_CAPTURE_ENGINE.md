# DOCUMENTACIÓN OFICIAL: MOTOR DE CAPTURA HEURÍSTICA Y DEDUPLICACIÓN DE 5 CAPAS (PORTING CARDIGAN -> FESTIS)

## 1. Resumen de Arquitectura
El subsistema de captura automática y asistida de convocatorias de festivales en Festis provee una solución determinista y asistida por IA para ingresar postulaciones desde el portapapeles y textos libres (WhatsApp, correos, sitios oficiales, plataformas como FilmFreeway y Festhome), aislando sellos de industria y garantizando la persistencia multi-tenant gobernada por RBAC.

---

## 2. Catálogos y Semillas Canónicas (`src/data/seed/`)

1. **`festivals.ts`**:
   Catálogo canónico `CANONICAL_FESTIVALS_SEED` que incluye festivales iberoamericanos e internacionales de clase A:
   - FAN (Festival Audiovisual Neuquén, Argentina)
   - BAFICI (Buenos Aires Festival Internacional de Cine Independiente)
   - Festival Internacional de Cine de Mar del Plata (FIAPF / INCAA)
   - Oberá en Cortos (Misiones, Argentina)
   - Festival de Cine de Villa Elisa (Entre Ríos, Argentina)
   - Festival de Cine Cuenca del Salado (Rauch, Argentina)
   - Sitges - Festival Internacional de Cinema Fantàstic de Catalunya (Oscar, Goya, FIAPF)
   - CutreCon (Madrid, España)
   - Animayo (Las Palmas de Gran Canaria, Oscar-Qualifying)
   - San Sebastian International Film Festival (SSIFF / Zinemaldia)
   - Festival Internacional de Cine de Huesca (Oscar, Goya)
   - FICX (Gijón, España)
   - Ajayu (Festival Internacional de Animación, Puno, Perú)
   - Festival Internacional de Cine Amazónico (Iquitos, Perú)
   - FICG (Guadalajara, México)
   - FICM (Morelia, México)
   - Festivales Clase A mundiales: Cannes, Berlinale, Venecia, Sundance, TIFF, Annecy, Clermont-Ferrand, Tampere, Oberhausen.

2. **`geography.ts`**:
   Mapeo curado de sedes y ciudades hacia países soberanos (`AUDIVISUAL_GEOGRAPHY_SEED`) con helper determinista `lookupCountryByCity` y límites de palabra estrictos.

3. **`platforms.ts`**:
   Detección de plataformas de postulación con `tldts` (`SHARED_PLATFORMS_SEED`): FilmFreeway, Festhome, Shortfilmdepot, Docfilmdepot, Clickforfestivals, Movibeta, Eventival y Uptofest.

4. **`vocabulary.ts`**:
   Sellos acreditados de la industria audiovisual (`VOCABULARY_SEED`): Oscar-Qualifying, Calificador a los Goya, BAFTA Qualifying, Méliès d'or, FIAPF y Auspicio INCAA; términos de gratuidad y descarte de convocatorias vencidas.

5. **`index.ts`**:
   Barrel público con exports unificados y las funciones `matchSeedFestival` y `lookupCanonicalFestival`.

---

## 3. Motor Heurístico y Deduplicación (`src/utils/`)

### `clipboardFestivalParser.ts`
- **`stripHumanPreambleAndNoise`**: Purga de timestamps, saludos de chat ("Hola chicos", "Buenas a todos", "Fíjense este festival") y despedidas/firmas ("Abrazo grande", "Saludos").
- **`cleanTrailingConnectorsAndIncompleteWords`**: Limpieza de preposiciones truncadas ('de', 'del', 'en', 'para', 'con', etc.) y palabras cortadas al final de títulos.
- **`isLegitimateFestivalTitle`**: Validador estricto que descarta frases conversacionales y confirma términos legítimos de festival.
- **`isBatchText` y `smartSegmentBatchText`**: Detección determinista de lotes con aislamiento hermético de sellos/tags por bloque, descartando falsos lotes de festivales extensos.
- **`parseNarrativeOrChatFestivalText`**: Parser de lenguaje natural para mensajes de mensajería y correos.
- **`parseClipboardFestivalText`**: Parser para texto estructurado o tabular.
- **`detectFestivalFromText`**: Entrada principal para un festival individual (consumida por el botón de autocompletado).
- **`detectMultipleFestivalsFromText`**: Entrada para procesamiento de lotes.
- **`parseClipboardContent`**: Wrapper público con fallback de tres niveles (Groq -> Gemini -> local determinista).

### `clipboardDeduplicator.ts`
Pipeline de 5 capas con discriminación explícita entre `DUPLICADO` vs `NUEVA_EDICION`:
1. **Capa 1 (URL / Platform Slug)**: Coincidencia de slug en plataformas conocidas (`tldts`).
2. **Capa 2 (Nombre Normalizado)**: Coincidencia sin stopwords ni años.
3. **Capa 3 (Fuzzy Matching con Fuse.js)**: Tolerancia difusa a variaciones tipográficas con `ignoreLocation: true` y threshold `0.45`.
4. **Capa 4 (Nombre Raíz + Token Sort + Geografía)**: Coincidencia de palabras clave y orden de tokens en la misma sede.
5. **Capa 5 (Catálogo Canónico / Acrónimos)**: Detección de alias que comparten el mismo registro canónico.
- **Discriminación `DUPLICADO` vs `NUEVA_EDICION`**: Si los nombres coinciden pero difieren en año o número de edición, se clasifica como `NUEVA_EDICION`.

---

## 4. Experiencia Táctil y Modales

1. **`useSwipeDrawer` (`src/hooks/useSwipeDrawer.ts`)**:
   Hook reactivo con `dragState` (`isDragging`, `dragOffsetPx`, `dragProgress`, `thresholdReached`, `direction`), Body Scroll Lock nativo y física 1:1 para el pulgar derecho con ratio 1.1 sobre la mitad inferior.

2. **`BatchClipboardDetectionModal` (`src/components/modals/BatchClipboardDetectionModal.tsx`)**:
   - Construido con `motion/react` y `AnimatePresence`.
   - Distinción visual con badges para `NUEVA_EDICION` (azul) y `DUPLICADO` (ámbar).
   - Barrera RBAC (`useProjectRole`): botón deshabilitado si `!isDistributor` con badge informativo de solo lectura.
   - Persistencia reactiva en Firestore `/projects/{projectId}/festivals`.

3. **`ProcessingExtractionModal` (`src/components/modals/ProcessingExtractionModal.tsx`)**:
   - Animación y barra de progreso determinista con paleta `#e91e63`.

4. **Botón de Autocompletado en `FestivalModal.tsx`**:
   - Ubicación: Footer del formulario de festival, al lado del botón de guardado.
   - Visibilidad: Exclusivamente visible en modo creación (`modalType === "create"`).
   - Comportamiento: Lee de `navigator.clipboard.readText()`, ejecuta `detectFestivalFromText` e hidrata reactivamente los campos del formulario con toast inmediato.

---

## 5. Backend Resiliente (`server.ts`)

Endpoint `POST /api/parse-festivals-batch`:
1. Groq Llama 3.3 70B Versatile (si `GROQ_API_KEY` está configurada).
2. Gemini 2.5 Flash vía `@google/genai` (si `GEMINI_API_KEY` está configurada).
3. Fallback a procesamiento determinista local del cliente.
4. Inyección dinámica de `fechaReferencia` en el system prompt para resolver referencias temporales relativas.

---

## 6. Suite de Benchmarks (`src/test/clipboardParser.test.ts`)

12 benchmarks ejecutados bajo `happy-dom` con Vitest con `global.fetch` mockeado offline:
- Benchmark 1: FAN (Festival Audiovisual Neuquén, Argentina con sello INCAA).
- Benchmark 2: Animayo (WhatsApp informal, Las Palmas, Oscar Qualifying).
- Benchmark 3: FICG (Prosa narrativa, Guadalajara, México).
- Benchmark 4: Lote latinoamericano (Ajayu, Villa Elisa, Amazónico).
- Benchmark 5: Aislamiento hermético de acreditaciones entre bloques.
- Benchmark 6: Cuenca del Salado (Rauch, Argentina con fee de 12 USD).
- Benchmark 7: Descarte de falsos lotes en festival individual extenso.
- Benchmark 8: Saneamiento anti-Frankenstein y conectores huérfanos.
- Benchmark 9: Deduplicación Capa 1 por URL / Platform Slug.
- Benchmark 10: Deduplicación Capa 2 por nombre normalizado.
- Benchmark 11: Discriminación explícita `DUPLICADO` vs `NUEVA_EDICION`.
- Benchmark 12: Resolución determinista local 100% offline.
