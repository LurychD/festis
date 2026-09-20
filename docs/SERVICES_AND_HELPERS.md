# Servicios, Hooks, Utilidades y Archivos Base

Este documento especifica la lógica de negocio auxiliar, los custom hooks de React, la infraestructura de Firebase y la configuración base de **Festis Cardigan**.

---

## 🛠️ 1. Custom Hooks (`src/hooks/`)

El directorio `src/hooks/` encapsula la lógica de estado reusable y la sincronización en tiempo real:

| Hook | Archivo | Descripción |
| :--- | :--- | :--- |
| `useFirestore` | `useFirestore.ts` | Hook principal para consultar y manipular colecciones de Firestore con manejo de loading y errores. |
| `useFirestoreSync` | `useFirestoreSync.ts` | Sincronización bidireccional en tiempo real mediante `onSnapshot` para colecciones completas. |
| `useFirestoreSyncDoc` | `useFirestoreSyncDoc.ts` | Sincronización en tiempo real sobre un documento específico de Firestore. |
| `useLocalSyncArray` | `useLocalSyncArray.ts` | Gestión de estado local respaldado en `localStorage` con fallback reactivo. |
| `useNotificationEngine` | `useNotificationEngine.ts` | Motor de cálculo de alertas y notificaciones programadas para vencimientos y eventos clave. |
| `useShaderParams` | `useShaderParams.ts` | Hook de control de parámetros para efectos visuales WebGL y shaders en segundo plano. |

---

## ⚙️ 2. Módulo de Helpers (`src/utils/helpers.ts`)

### Motor de Búsqueda Frecuencial y Fuzzy: `searchFestivals(festivals, query)`
Algoritmo de filtrado multitrayecto:
1. Limpia diacríticos y convierte a minúsculas (`normalize('NFD')`).
2. Tokeniza la búsqueda por espacios en blanco.
3. Exige que **todos** los tokens ingresados coincidan exactamente o mediante distancia Levenshtein ($\le 1$) en los campos `name`, `category`, `platform`, `observations` o `nomination`.

### Cálculo de Distancia Levenshtein: `getLevenshteinDistance(a, b)`
Algoritmo dinámico para medir la diferencia entre dos cadenas de texto y tolerar pequeños errores tipográficos durante la búsqueda.

### Formateadores de Fecha:
- `formatCustomDateStr(dateStr)`: Convierte fechas ISO o cadenas `YYYY-MM-DD` a formato legible en español (ej. *"15 de Oct, 2026"*).
- `formatDateTimeForInput(dateStr)`: Adapta marcas de tiempo para controles de entrada HTML `<input type="datetime-local">`.

### Estilos de Estado: `getStatusColorStyles(status)`
Retorna las clases CSS de Tailwind (colores de fondo, texto y bordes) asociadas a cada estado dentro de `FestivalStatus` para mantener consistencia visual en toda la app.

---

## 💾 3. Servicio Firebase (`src/services/firebase.ts`)

- **Persistencia Firestore (`festis-cardigan`):**
  - Sincronización en tiempo real vía `onSnapshot`.
  - Habilitación de caché offline mediante `enableIndexedDbPersistence`.
- **Manejo de Errores de Conexión:**
  - Reintento automático y degradación elegante cuando se opera sin conexión a internet.

---

## 🛡️ 4. Archivos Base de la Aplicación (`src/`)

- `AuthProvider.tsx`: Proveedor de contexto para autenticación de usuarios, sesión y control de roles (`isAuthorized`).
- `AppContextType.ts`: Definición de tipos TypeScript para el contexto global de la aplicación.
- `errorHandlers.ts`: Manejador global de excepciones no capturadas y promesas rechazadas (`window.onerror`, `unhandledrejection`).
- `polyfills.ts`: Polyfills de compatibilidad para navegadores y entornos de ejecución antiguos.
- `version.ts`: Fuente única de verdad (Single Source of Truth) para la versión del sistema (`APP_VERSION`, `DOCS_VERSION`, `DOCS_VERSION_NOTICE`), importado directamente de `package.json`. Al modificar la versión en `package.json` o `src/version.ts`, se actualizan automáticamente la interfaz gráfica, la wiki y todas las insignias de versión.
