# Gestión de Estado, Sincronización Realtime y Modo Offline — Guía Técnica

Este documento proporciona la especificación técnica completa de la arquitectura de estado reactivo, sincronización bidireccional en tiempo real con Firestore y persistencia en caché offline en **Festis Cardigan**.

---

## 🏗️ 1. Arquitectura General de Estado Reactivo

El sistema utiliza un patrón híbrido de administración de estado:

1. **Estado Local Inmediato (React State & Refs):** Ofrece tiempos de respuesta de 0 ms a la interacción del usuario (UI Optimista).
2. **Capa de Persistencia Dual (Firestore + LocalStorage/IndexedDB):** Mantiene la sincronización en segundo plano con la nube mientras resguarda copias locales contra pérdidas de red.
3. **Contadores de Consumo de Datos:** Rastrea métricas de rendimiento y lecturas/escrituras en tiempo real (`readCounters.ts`).

```
  ┌─────────────────────────────────────────────────────────┐
  │                    React Components                     │
  └────────────────────────────┬────────────────────────────┘
                               │ (lectura / dispatch)
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │               useFirestoreSyncArray Hook                │
  └──────────────┬───────────────────────────┬──────────────┘
                 │                           │
  (Modo Online / Auth)            (Modo Offline / LocalMode)
                 │                           │
                 ▼                           ▼
  ┌─────────────────────────────┐   ┌───────────────────────┐
  │   Cloud Firestore DB        │   │   localStorage /      │
  │  (onSnapshot / writeBatch)  │   │   IndexedDB Cache     │
  └─────────────────────────────┘   └───────────────────────┘
```

---

## 🔄 2. Hook Principal de Sincronización (`useFirestoreSyncArray`)

Ubicación: `src/hooks/useFirestoreSync.ts`  
Firma de Función: `useFirestoreSyncArray<T extends { id: string }>(path, initialData, queryConfig, options)`

### Mecanismo de Funcionamiento Interno

#### A. Suscripción a Sockets en Tiempo Real (`onSnapshot`)
Cuando el usuario está autenticado y no se encuentra en modo local, el hook inicia un escuchador `onSnapshot` sobre la colección de Firestore:

- **Detección de Origen de Datos:** Verifica si el snapshot proviene de la caché del navegador o del servidor remoto (`snapshot.metadata.fromCache`).
- **Métricas de Lecturas:** Contabiliza las lecturas consumidas mediante `trackFirestoreReads()` solo cuando los datos provienen directamente del servidor y no de escrituras pendientes.
- **Indexación por Map en Memoria (`dbDataRef`):** Mantiene un objeto `Map<string, T>` con el estado idéntico de la base de datos para realizar comparaciones dif de alta velocidad antes de enviar modificaciones.

#### B. Actualización Optimista e Inmutable (`updateData`)
Al llamar a la función de actualización devuelta por el hook:

1. **Renderizado Inmediato:** Se resuelve el nuevo estado local y se remueven duplicados basándose en la clave única `id`.
2. **Evaluación Diff (Evita Escrituras Innecesarias):** Se compara cada elemento modificado contra el `Map` en memoria (`JSON.stringify(item) !== JSON.stringify(dbItem)`). Si no hay cambios reales, no se emite ninguna petición de red.
3. **Chunking de Lotes (Batches de 450 elementos):** Firestore limita las operaciones por lote (`writeBatch`) a 500 escrituras. El hook divide automáticamente las operaciones en bloques de 450 items para evitar excepciones en colecciones masivas.

```typescript
// Fragmento de la división en batches de 450 en useFirestoreSync.ts
const chunkSize = 450;
for (let i = 0; i < operations.length; i += chunkSize) {
  const chunk = operations.slice(i, i + chunkSize);
  const batch = writeBatch(db);
  chunk.forEach(op => {
     if (op.type === 'set') batch.set(op.ref, op.data);
     if (op.type === 'update') batch.update(op.ref, op.data);
     if (op.type === 'delete') batch.delete(op.ref);
  });
  await batch.commit();
}
```

---

## 📄 3. Sincronización de Documento Único (`useFirestoreSyncDoc`)

Ubicación: `src/hooks/useFirestoreSyncDoc.ts`  
Utilizado para mantener sincronizados en tiempo real documentos de configuración global (como las preferencias de interfaz, configuración de notificaciones o metadatos de la distribuidora).

---

## 💾 4. Persistencia Local Pura (`useLocalSyncArray`)

Ubicación: `src/hooks/useLocalSyncArray.ts`  
Proporciona una interfaz idéntica a `useFirestoreSyncArray`, pero operando exclusivamente sobre `localStorage`. Se utiliza en módulos aislados que no requieren sincronización multiusuario (como configuraciones visuales del lienzo 3D `OceanShader` o preferencias del cliente).

---

## 📊 5. Monitoreo de Consumo de Base de Datos (`readCounters.ts`)

Ubicación: `src/utils/readCounters.ts`  
Para evitar costos inesperados y auditar el rendimiento de la aplicación, el sistema registra la cantidad exacta de lecturas, escrituras y eliminaciones ejecutadas durante la sesión activa:

- `trackFirestoreReads(count)`: Incrementa el contador global de lecturas.
- `trackFirestoreWrites(count)`: Incrementa el contador de escrituras.
- `trackFirestoreDeletes(count)`: Incrementa el contador de eliminaciones.

Estos valores son consumidos por el componente `FirestoreDebugger.tsx` en el panel de depuración.

---

## 🌐 6. Transparencia de Origen de Datos e Indicador en Header (`NetworkStatusBadge.tsx`)

Ubicación: `src/components/NetworkStatusBadge.tsx`

Para garantizar total claridad sobre el origen de los datos que lee y escribe la aplicación, el encabezado principal (`AppHeader.tsx`) y el menú lateral integran el componente `NetworkStatusBadge`.

### Estados del Indicador:
1. **Nube (Firestore):** Badge verde esmeralda con icono de nube. Confirma conexión activa con la base de datos central de Firebase Firestore (`festis-cardigan-db`). Al hacer clic, abre un modal flotante protegido por Portal (`createPortal`) con información detallada de estado, conectividad y la opción de pasar a entorno local aislado si se requiere.
2. **Modo Local (Caché):** Badge ámbar pulsante con icono de base de datos local. Indica que la aplicación está operando sobre `localStorage` (o datos semilla) y que las modificaciones no impactan en la nube. Incluye un botón directo para **"Conectar a la Nube (Firestore)"**.
3. **Sin Conexión (Offline):** Badge de advertencia cuando `navigator.onLine` es falso.

### Bus de Eventos de Sincronización (`cardigan:sync-mode-change`):
Cuando el usuario conmuta entre Nube y Modo Local:
- Se actualiza o remueve la clave `__localMode` en `localStorage`.
- Se dispara el evento global `window.dispatchEvent(new Event('cardigan:sync-mode-change'))`.
- Tanto `useFirestoreSyncArray` como `useFirestoreSyncDoc` escuchan este evento de forma reactiva, reconectando los listeners `onSnapshot` de Firestore sin requerir una recarga forzada del navegador.

---

## 🛡️ 7. Restauración de Base de Datos y Control de Estados

### Migración Definitiva a `festis-cardigan-db`
Tras el incidente provocado por la rutina de auto-cierre previa, la base de datos fue restaurada íntegramente a partir del backup limpio de Cloud Firestore del 6 de septiembre en una nueva base de datos dedicada llamada **`festis-cardigan-db`**.
- La aplicación se conecta exclusivamente a esta base de datos limpia.
- La rutina de cierre automático fue eliminada definitivamente de `src/App.tsx`.
- Se retiraron los banners temporales de asistencia del Dashboard para mantener la interfaz limpia y sin ruido visual, ya que la base de datos contiene los estados originales exactos.
- El badge de conectividad en el encabezado (`NetworkStatusBadge`) fue migrado a una arquitectura basada en React Portal para que su apertura sea 100% confiable y no sufra recortes por `overflow-hidden` del header.

### Blindaje Estricto contra Sobreescrituras Prematuras en el Arranque:
1. **Precedencia Absoluta de Firestore:** La colección `festivals` se inicializa con array vacío `[]` (y no con semillas locales) para que ningún dato transitorio pueda ser empujado a Firestore antes de que el servidor responda.
2. **Guardia `isFirestoreReadyRef`:** En `useFirestoreSyncArray`, cualquier llamada a `updateData()` queda estrictamente bloqueada hasta que `isFirestoreReadyRef.current` sea `true` (es decir, hasta que el primer `onSnapshot` de Firestore haya sido recibido con éxito).
3. **Eliminación de Auto-Backfills en Cascada:** Se eliminó cualquier `useEffect` que detecte diferencias en el cliente y escriba lotes hacia Firestore sin mediar una acción manual explícita del usuario.
4. **Purga Automática de Caché Local:** En modo nube, la aplicación purga automáticamente claves residuales previas de `local_festivals` para evitar que datos caducos del cliente interfieran con la base de datos central.

---

## ⏳ 8. Compuerta de Sincronización Inicial de Datos (Initial Sync Gate)

Para evitar el efecto de "layout shift" o el parpadeo de interfaces vacías al iniciar sesión (donde los paneles mostraban momentáneamente 0 festivales o tablas desiertas hasta la llegada del primer snapshot), `src/App.tsx` implementa una compuerta de sincronización inicial reactiva:

1. **Monitoreo de Estado de Carga:** El componente principal captura el booleano `loading` emitido por `useFirestoreSyncArray` para las colecciones críticas iniciales (`isFestivalsLoading` e `isPlansLoading`).
2. **Pantalla de Espera Dinámica:** Mientras `!isInitialSyncDone`, se retiene la visualización del `AppSplashScreen` configurado con el mensaje amigable: *"Cargando, espera un momento..."*.
3. **Resolución Automática:** Cuando ambas colecciones reciben su primer snapshot remoto de Firestore, `isInitialSyncDone` conmuta a `true` y la interfaz se despliega de inmediato con todos los datos y métricas completamente poblados.
4. **Temporizador Preventivo de Rescate:** Cuenta con un timeout de seguridad de 2.8 segundos que desbloquea la vista si la conexión a internet es lenta o si la base de datos se encuentra vacía, garantizando que el usuario jamás quede bloqueado.


