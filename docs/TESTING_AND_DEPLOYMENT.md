# Guía de Pruebas, Diagnóstico y Despliegue

Este documento detalla los procedimientos de verificación de calidad de código, herramientas de diagnóstico in-app, compilación y despliegue del proyecto **Festis Cardigan**.

---

## 🧪 1. Control de Calidad y Verificación de Código

El proyecto integra un pipeline dual de aseguramiento de calidad: análisis estático de tipos con TypeScript y suite automatizada de pruebas unitarias y de integración con Vitest y React Testing Library.

### Comandos de Verificación:

```bash
# Ejecutar verificación estática de tipos (TypeScript)
npm run lint

# Ejecutar suite automatizada de pruebas (Vitest en modo headless)
npm run test
```

### Arquitectura de Pruebas Automatizadas (Vitest + Happy DOM):
- **Motor de ejecución:** `vitest` configurado en `vitest.config.ts`.
- **Entorno de simulación DOM:** `happy-dom`, emulador ultraliviano y de alto rendimiento que no requiere navegadores pesados ni instancias de Chromium.
- **Librerías de interacción:** `@testing-library/react`, `@testing-library/jest-dom` y `@testing-library/user-event`.
- **Setup y limpieza:** `src/test/setup.ts` ejecuta `cleanup()` de forma transparente tras cada caso de prueba (`afterEach`).
- **Suites implementadas:**
  - `src/test/clipboardQualitySprint.test.tsx`: Pruebas de contrato para caché persistente de 24 horas en localStorage/memoria, expiración determinista con FakeTimers, detección y badge de convocatorias vencidas (`bg-rose-50 text-rose-700`), desmarcado preventivo, edición inline de link/URL, blindaje anti-falsos positivos de co-ocurrencia cinematográfica (descarte de deportes y música), y deduplicación en vivo contra Pool Dual.
  - `src/test/clipboardAndBadgesHotfix.test.tsx`: Pruebas de contrato para cálculo de antigüedad (`isNewFestival`), casos corruptos o nulos, edición inline por doble-tap, hold-to-confirm de 3s en importación de lotes, aserción estricta de no duplicación de badge en `FestivalDetailsView` e insignias en los submódulos del Dashboard.
  - `src/test/FestivalClipboardFallback.test.tsx`: Pruebas de cierre de formulario y delegación al gateway universal de lotes ante pegado directo o contingencia manual, y rechazo ante textos corruptos.
  - `src/test/clipboardParser.test.ts`: Pruebas del motor heurístico de extracción de festivales y deduplicación de 5 capas de Cardigan.
  - `src/test/versionAndBuildInfo.test.ts`: Pruebas de contrato de versionado (`Beta 0.5`), extracción de número y hash de commit de Git, resiliencia en generación de metadatos para Docker/Fly.io y blindaje contra caídas a `"local"` o `"local-dev"`.
  - `src/test/ProjectsHomeView.test.tsx`: Pruebas de renderizado y selector de obras audiovisuales.
  - `src/test/ProjectMembersPanel.test.tsx`: Smoke test integral sobre la gestión de miembros, validando renderizado de integrantes, generador de invitaciones para rol Propietario, selector de roles (`distribuidor`, `colaborador`, `guest`) y modo solo lectura para usuarios con permisos restringidos.
  - `src/test/ModalAndSwipeGestures.test.tsx`: Pruebas de ergonomía táctil y gestos móviles.
- **Resultado de ejecución:** 8 archivos de prueba pasados (100%), 67 tests pasados, 0 fallados.

---

## 🛠️ 2. Herramientas de Diagnóstico y Depuración In-App

Festis Cardigan integra una suite de herramientas de depuración accesibles desde la vista de Configuración o accesos rápidos de administrador:

| Herramienta | Archivo | Propósito |
| :--- | :--- | :--- |
| **Consola de Depuración** | `DebugConsole.tsx` | Muestra en tiempo real los eventos del sistema, registros de red y excepciones capturadas. |
| **Auditor de Firestore** | `FirestoreDebugger.tsx` | Verifica el estado del socket en tiempo real de Firebase, latencia de respuesta y cuota de lecturas/escrituras. |
| **Inspector de Duplicados** | `KeyDuplicatesInspector.tsx` | Escanea la base de datos local y remota para prevenir choques de IDs o duplicación de claves de festivales. |
| **Manejador de Errores** | `ErrorBoundary.tsx` | Intercepta fallos críticos en la UI de React evitando cierres inesperados y mostrando una pantalla de recuperación. |

---

## 🏗️ 3. Proceso de Build (Compilación)

El proceso de compilación genera un paquete optimizado y minificado tanto para el cliente frontend como para el servidor backend:

```bash
npm run build
```

### Pasos Internos del Build:
1. **Frontend SPA (`vite build`):**
   - Transpila todo el código React y TypeScript a JavaScript estático compatible con navegadores modernos.
   - Procesa y purga estilos de Tailwind CSS en `dist/`.
   - Genera chunks optimizados para carga diferida (lazy loading).
2. **Backend Server (`esbuild server.ts`):**
   - Empaqueta `server.ts` en un único archivo CommonJS `dist/server.cjs`.
   - Bypassea problemas de resolución de rutas relativas en ES Modules.
   - Incluye sourcemaps para debugging de errores en producción.

---

## 🚀 4. Despliegue en Producción (Cloud Run / Contenedores Docker)

El entorno de producción se ejecuta sobre contenedores aislados con las siguientes restricciones obligatorias:

### Especificaciones del Contenedor:
- **Puerto:** `3000` (Hardcoded por la infraestructura de ingress).
- **Host Binding:** `0.0.0.0`.
- **Dockerfile (Multi-stage build):** Utiliza `node:20-alpine`, realiza `npm install` en la etapa builder (tolerante a adiciones dinámicas de paquetes) y ejecuta `npm prune --omit=dev` para luego copiar los `node_modules` limpios de producción directamente al runner, garantizando builds de Fly.io robustos y sin errores de sincronización con lockfiles.
- **Comando de Inicio:**
  ```bash
  npm start
  ```
  Ejecuta `node dist/server.cjs` iniciando el servidor Express unificado.

### Healthcheck y Verificación de Estado:
Para verificar que el contenedor está funcionando correctamente tras el despliegue:

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:
```json
{ "status": "ok" }
```

---

## 📋 5. Checklist de Verificación Pre-Despliegue

Antes de liberar una nueva versión a producción, asegúrese de cumplir los siguientes pasos:

1. [x] **Validación de Linter:** `npm run lint` finaliza con 0 errores (`tsc --noEmit`).
2. [x] **Verificación de Build:** `npm run build` genera exitosamente la carpeta `dist/` y `dist/server.cjs`.
3. [x] **Declaración de Variables:** Todas las nuevas variables de entorno están documentadas en `.env.example`.
4. [x] **Persistencia:** Confirmar que las 14 colecciones en Firestore sincronizan reactivamente sin excepciones de permisos.

---

## 📦 6. Historial de Versiones y Registro de Cambios (Changelog)

### Versión `Beta 0.5` (Corte de Madurez y Despliegue en Fly.io)
- **Versionado Global Beta 0.5:**
  - Unificación de la versión en `Beta 0.5` en `package.json`, `src/version.ts` y componentes de UI (`ConfigView`, `DocsWikiView`).
- **Motor de Inyección de Commit y Resiliencia en Fly.io:**
  - Creación del generador `scripts/generate-build-info.js` y artefacto `src/build-info.json` para persistir número correlativo de commit (`r142`), hash abreviado (`a5b8e9f`) y marca temporal de build.
  - Erradicación de lecturas frágiles con fallback estático `"local-dev"` o `"local"`.
  - Instalación de `git` en la etapa builder de `Dockerfile` y remoción de `.git` en `.dockerignore` para permitir extracción directa durante el despliegue con `fly deploy`.
  - Soporte para argumentos de construcción `--build-arg COMMIT_SHA` y `--build-arg COMMIT_COUNT`.
- **Suite de Pruebas Automatizadas (`src/test/versionAndBuildInfo.test.ts`):**
  - Pruebas estrictas con aserciones literales sobre número de commit y hash de Git.
  - Validación de casos negativos ante ausencia de Git, variables fraudulentas y resiliencia en contenedores sin repositorio.

### Versión `10.sep.2026-a` (Corte Previo de Producción)
- **Banner Unificado de Planes de Distribución en Festivales:**
  - Integración en la cabecera de `FestivalDetailModal.tsx` informando si el festival pertenece a uno o más Planes de Distribución activos (`distribution_plans_Cardigan`), mostrando el nombre del plan, el presupuesto asignado y un acceso directo reactivo para abrirlo en la pestaña de Planes.
- **Motor de Exportación PDF de Planes de Distribución (`distributionPlanPdfExport.ts`):**
  - Filas dinámicas multilínea automáticas con `splitTextToSize` que calculan matemáticamente la altura requerida para nombres, países, costos, links y observaciones sin cortes ni desbordes.
  - Saltos de página preventivos `checkPageBreak` que mantienen las cabeceras de tabla alineadas en cada página.
  - Selector opcional en modal para incluir o excluir la columna `Observaciones`, redistribuyendo el espacio horizontal restante proporcionalmente entre las columnas principales.
  - Banner oficial de Institución Reguladora mostrando `# festivales propuestos`, eliminando menciones internas de borradores.
  - Bloque condicional de `Notas y Observaciones Ad-Hoc` configurables por emisión.
- **Sincronización y Respaldo Integral de la Base de Datos:**
  - Cobertura completa de las 14 colecciones de Firestore en `src/App.tsx` (`exportDB` en ZIP/JSON, `exportDBExcel` en XLSX y restauración verificada en `handleImportData`).
  - Actualización del validador `backupValidator.ts` para filtrado y sanitización de `distributionPlans`, `institutions` y `platforms`.
  - Panel de monitoreo de colecciones y descarga individual en `ConfigView.tsx`.
- **Calidad y Estabilidad de Código:**
  - Validación completa con `tsc --noEmit` (0 errores).
  - Generación de bundle de producción con `vite build` y `esbuild` sin advertencias.

