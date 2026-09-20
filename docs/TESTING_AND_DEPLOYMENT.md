# Guía de Pruebas, Diagnóstico y Despliegue

Este documento detalla los procedimientos de verificación de calidad de código, herramientas de diagnóstico in-app, compilación y despliegue del proyecto **Festis Cardigan**.

---

## 🧪 1. Control de Calidad y Verificación de Código

El proyecto utiliza TypeScript (`tsc`) y un linter riguroso para la detección temprana de errores de tipos, sintaxis e imports no resueltos.

### Comandos de Verificación:

```bash
# Ejecutar verificación de tipos y linter
npm run lint
```

Este comando ejecuta `tsc --noEmit` validando:
- Coherencia de tipos e interfaces en todo el repositorio.
- Ausencia de imports rotos o dependencias no instaladas.
- Coincidencia de esquemas de datos entre componentes y hooks.

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

### Versión `10.sep.2026-a` (Corte de Producción)
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

