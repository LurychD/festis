# ARQUITECTURA DE VERSIONADO Y DESPLIEGUE EN FLY.IO · FESTIS BETA 0.5

Este documento define la arquitectura de versionado unificado, extracción de metadatos de Git (número correlativo de commit, hash y fecha) y mitigación de fallbacks en entornos de despliegue sobre contenedores Docker en Fly.io.

---

## 1. Problema Diagnosticado y Causa Raíz

En despliegues previos sobre Fly.io, la interfaz de usuario en la vista de Configuración y Diagnóstico mostraba la etiqueta `local-dev` o `local` en lugar del identificador real del commit de Git.

Las causas raíz identificadas fueron:
1. **Consumo de variable no provista:** `src/components/ConfigView.tsx` leía `(import.meta as any).env.VITE_GITHUB_SHA` con un fallback estático a `"local-dev"`.
2. **Exclusión de Git en el contexto de Docker:** El archivo `.dockerignore` contenía la regla `.git`, lo cual descartaba el historial y las referencias de Git al empaquetar el contexto enviado por `flyctl` hacia el builder remoto.
3. **Ausencia de Git en la imagen base:** La etapa `builder` en el `Dockerfile` (`node:20-alpine`) carecía del binario `git` instalado por defecto.

---

## 2. Solución Arquitectónica en Tres Capas (Triple-Tier Injection)

Para garantizar que el número correlativo de commit (ej. `r142`), el hash abreviado (`a5b8e9f`) y la versión de la aplicación (`Beta 0.5`) se sincronicen de forma determinista y sin fallos, se implementó una estrategia en tres capas:

```
┌────────────────────────────────────────────────────────┐
│  Capa 1: Extracción en caliente mediante Git           │
│  `git rev-list --count HEAD` & `git rev-parse --short` │
└──────────────────────────┬─────────────────────────────┘
                           │ Fallback si no hay .git
┌──────────────────────────▼─────────────────────────────┐
│  Capa 2: Variables de Entorno (CI/CD & Fly.io)        │
│  VITE_COMMIT_COUNT, VITE_COMMIT_SHA, FLY_IMAGE_REF     │
└──────────────────────────┬─────────────────────────────┘
                           │ Fallback de seguridad
┌──────────────────────────▼─────────────────────────────┐
│  Capa 3: Archivo Base `src/build-info.json`            │
│  Garantiza nunca devolver "local" o "undefined"        │
└────────────────────────────────────────────────────────┘
```

### Flujo de Generación de Metadatos
1. El script `scripts/generate-build-info.js` se invoca en los hooks `"predev"` y `"prebuild"` definidos en `package.json`.
2. Genera el artefacto `src/build-info.json` con la siguiente estructura tipada:
   ```json
   {
     "version": "Beta 0.5",
     "commitNumber": 142,
     "commitHash": "a5b8e9f0c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7",
     "commitShortHash": "a5b8e9f",
     "commitBranch": "main",
     "buildDate": "2026-10-14T06:29:42.876Z"
   }
   ```
3. El módulo `src/version.ts` importa de forma centralizada este JSON y exporta:
   - `APP_VERSION`: `"Beta 0.5"`
   - `COMMIT_NUMBER`: Número correlativo de commit (entero mayor a cero).
   - `COMMIT_HASH`: Hash abreviado de 7 caracteres.
   - `BUILD_DATE`: Marca temporal ISO de la compilación.
   - `formatFullVersion()`: Función utilitaria que genera `"Beta 0.5 (r142 · a5b8e9f)"`.

---

## 3. Adaptaciones para Despliegues en Fly.io (`fly deploy`)

### A. Contexto de Compilación en `.dockerignore`
Se eliminó la exclusión `.git` de `.dockerignore`. Esto permite que al ejecutar `fly deploy`, el subdirectorio `.git` viaje dentro del contexto hacia el constructor de imágenes, permitiendo a los scripts consultar Git en tiempo de build.

### B. Imagen Builder en `Dockerfile`
En la etapa `builder`:
- Se instala Git mediante `apk add --no-cache git`.
- Se definen argumentos de construcción opcionales:
  ```dockerfile
  ARG COMMIT_SHA
  ARG COMMIT_COUNT
  ARG BUILD_DATE
  ENV VITE_COMMIT_SHA=${COMMIT_SHA}
  ENV VITE_COMMIT_COUNT=${COMMIT_COUNT}
  ENV VITE_BUILD_DATE=${BUILD_DATE}
  ```
- Al invocar `npm run build`, se ejecuta automáticamente `node scripts/generate-build-info.js` antes de `vite build`.

### C. Aislamiento y Seguridad en la Etapa Runner
La etapa `runner` del `Dockerfile` **no** copia el directorio `.git`. Únicamente transfiere `dist/`, `public/`, `node_modules/` y `package*.json`. Por ende:
- La imagen final en producción es liviana y no contiene el historial de Git.
- Los metadatos de versión quedan horneados de forma inmutable en los chunks de JavaScript compilados.

---

## 4. Opciones de Ejecución al Desplegar

### Opción Estándar (Automática):
```bash
fly deploy
```
El constructor dentro del contenedor lee directamente el repositorio `.git` copiado y calcula los metadatos.

### Opción con Inyección Explícita de Build Args (CI/CD o GitHub Actions):
```bash
fly deploy \
  --build-arg COMMIT_SHA=$(git rev-parse --short HEAD) \
  --build-arg COMMIT_COUNT=$(git rev-list --count HEAD) \
  --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
```

---

## 5. Pruebas Automatizadas en Vitest

La suite `src/test/versionAndBuildInfo.test.ts` valida:
- Igualdad literal estricta (`toBe`) de `APP_VERSION` contra `"Beta 0.5"`.
- Validación de que `COMMIT_NUMBER` sea un número entero mayor a cero.
- Validación de formato hexadecimal de `COMMIT_HASH` (`^[0-9a-fA-F]{7,40}$`).
- Validación de casos negativos ante ausencia de Git, variables de entorno vacías o corruptas.
- Aserción de que el sistema **nunca** produzca `"local"`, `"local-dev"` o `"undefined"`.
