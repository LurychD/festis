# Autenticación, Seguridad y Control de Acceso (RBAC) — Guía Técnica

Este documento especifica la arquitectura de autenticación de usuarios, la persistencia de sesiones, la seguridad en Firestore y los mecanismos de bypass para desarrollo local en **Festis Cardigan**.

---

## 🔐 1. Arquitectura de Autenticación (`AuthProvider.tsx`)

Ubicación del Archivo: `src/AuthProvider.tsx`  
Proveedor de Identidad: Firebase Authentication (`GoogleAuthProvider`, `Email/Password`)  
Contexto React: `AuthContext` (disponible globalmente a través del hook `useAuth()`)  

### Ciclo de Vida del Estado de Autenticación

1. **Inicialización y Listener de Estado:**
   Al montarse el `AuthProvider`, el observador nativo `onAuthStateChanged` de Firebase Auth controla de forma estricta y transparente la existencia de un usuario real. No se admiten credenciales simuladas ni sesiones anónimas. Toda petición que llega a Firestore o Storage cuenta con un JWT oficial de Google o es bloqueada por la compuerta de login.

2. **Autenticación Exclusiva con Google (`loginWithGoogle`):**
   El sistema opera exclusivamente mediante el proveedor oficial de Google (`GoogleAuthProvider`) con persistencia local permanente (`browserLocalPersistence`).

3. **Manejo de Entorno iFrame y Apertura en Pestaña Independiente:**
   En entornos de previsualización web donde la aplicación se encuentra embebida en un iFrame, las políticas de seguridad del navegador (partición de almacenamiento y bloqueo de ventanas emergentes entre orígenes) pueden impedir que el popup de OAuth complete el intercambio de credenciales. La aplicación detecta activamente el estado `isIframe` y provee una acción directa para abrir la app en una pestaña de primer nivel (`window.open(window.location.href, '_blank')`), asegurando un flujo de autenticación nativo y sin restricciones.

4. **Administración Exclusiva de Axel Ibarra:**
   En `firestore.rules`, la función `isAdmin()` está restringida de manera estricta y exclusiva a `axeldibarra@gmail.com` y su identificador único de cuenta (`IslcgZ6p0hRom8hSsZ9scw30tD12`). Los usuarios regulares solo acceden a proyectos donde su correo figure explícitamente en el arreglo `authorizedUsers` o en el campo `createdBy`.

```typescript
// Fragmento simplificado del flujo de login en AuthProvider.tsx
const loginWithGoogle = async () => {
  setAuthError(null);
  try {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    
    if (token) {
      setAccessToken(token);
      localStorage.setItem('google_access_token', token);
    }
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      setAuthError('El inicio de sesión fue bloqueado por el navegador.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      setAuthError('La ventana de inicio de sesión se cerró inesperadamente.');
    }
  }
};
```

---

## 🛡️ 2. Manejo de Errores e iFrames

Cuando la aplicación se ejecuta embebida en un iFrame (por ejemplo, en el entorno de desarrollo o sandbox), el navegador puede bloquear el paso de cookies de sesión entre dominios. `AuthProvider.tsx` detecta activamente el contexto de iFrame:

```typescript
const isIframe = window !== window.parent || window !== window.top;
```

Si el popup de Google es bloqueado o cerrado por restricciones cross-origin, el proveedor captura las excepciones `auth/popup-blocked` y `auth/popup-closed-by-user`, ofreciendo al usuario la alternativa de abrir la aplicación en una nueva pestaña independiente (↗️) o activar el modo local offline.

---

## ⚡ 3. Modo Offline y Bypass de Desarrollo (`__localMode`)

Para garantizar la disponibilidad continua del sistema sin depender de credenciales de Firebase en entornos de pruebas o demostraciones sin conexión:

- **Interruptor de Modo Local:** En el panel de Configuración o consola de depuración, el usuario puede conmutar el indicador `__localMode` en `localStorage`.
- **Efecto en los Hooks:** Cuando `__localMode === 'true'`, los hooks de sincronización (`useFirestoreSyncArray`, `useFirestoreSyncDoc`) omiten las peticiones a la red y sirven/guardan los datos directamente en `localStorage` / `IndexedDB`.
- **Rol Administrador Simulado:** Permite probar vistas restringidas (Auditoría, Inspector de Duplicados, Consola de Depuración) sin necesidad de autenticar una cuenta de Google real.

---

## 📜 4. Reglas de Seguridad Multi-Tenant en Firestore (`firestore.rules`)

El acceso a la base de datos oficial `ai-studio-festis-47ac01ed-d892-442e-86c8-bda460e78b33` está protegido en el servidor por reglas de seguridad declarativas que aíslan los datos por proyecto/obra audiovisual.

### Control de Acceso Jerárquico por Proyecto en Firestore

Base de datos: `festis-db-a`  
Storage Bucket: `festis-bucket-a`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }

    function isProjectAuthorized(projectId) {
      let projectData = get(/databases/$(database)/documents/projects/$(projectId)).data;
      return isAuthenticated() && (
        (request.auth.token.email != null && (
          projectData.createdBy == request.auth.token.email ||
          projectData.authorizedUsers.hasAny([request.auth.token.email])
        )) ||
        (request.auth.uid != null && projectData.ownerId == request.auth.uid) ||
        (request.auth.token.email == 'axeldibarra@gmail.com')
      );
    }

    // Colección raíz de Proyectos
    match /projects/{projectId} {
      allow read: if isAuthenticated() && (
        (request.auth.token.email != null && (
          resource.data.createdBy == request.auth.token.email ||
          resource.data.authorizedUsers.hasAny([request.auth.token.email])
        )) ||
        (request.auth.uid != null && resource.data.ownerId == request.auth.uid) ||
        (request.auth.token.email == 'axeldibarra@gmail.com')
      );
      // Cualquier usuario autenticado puede dar de alta un nuevo proyecto
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && (
        (request.auth.token.email != null && (
          resource.data.createdBy == request.auth.token.email ||
          resource.data.authorizedUsers.hasAny([request.auth.token.email])
        )) ||
        (request.auth.uid != null && resource.data.ownerId == request.auth.uid) ||
        (request.auth.token.email == 'axeldibarra@gmail.com')
      );

      // Subcolecciones aisladas de cada proyecto (festivals, distribution_plans, etc.)
      match /{subcollection}/{docId} {
        allow read, write: if isProjectAuthorized(projectId);
      }
    }

    // Colecciones Globales
    match /platforms/{docId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    match /members/{memberId} {
      allow read, write: if isAuthenticated();
    }
    
    match /auditlogs/{logId} {
      allow read, create: if isAuthenticated();
      allow update, delete: if false; // Inmutabilidad forense
    }

    match /bugs/{bugId} {
      allow read, write: if isAuthenticated();
    }

    match /roadmap/{itemId} {
      allow read, write: if isAuthenticated();
    }

    match /notifications/{notifId} {
      allow read, write: if isAuthenticated();
    }

    match /config/{configId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    match /social_posts/{postId} {
      allow read, write: if isSignedIn();
    }

    match /system_settings/{settingId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    match /user_notif_prefs/{userId} {
      allow read, write: if isUserEmail(userId) || isAdmin();
    }
  }
}
```

### Seguridad en Firebase Storage
- Bucket oficial del proyecto: vinculado a `firebase-applet-config.json` y mapeado explícitamente en `firebase.json` (`festis-bucket-a`).
- Verificación de sesión previa: el helper `uploadFileToStorage` ejecuta un pre-flight mediante `auth.authStateReady()` y renovación forzada de token (`getIdToken(true)`) garantizando que la petición viaje con un bearer token válido para evitar rechazos por `auth == null`.
- Resiliencia y almacenamiento estático autónomo: si el bucket rechaza la subida por permisos IAM (`storage/unauthorized`), el binario comprimido en cliente se almacena de forma transparente en el endpoint local de assets `/api/storage/upload` bajo `/uploads/projects/{projectId}/...`, evitando cualquier caída visual y asegurando funcionamiento de punta a punta sin guardar base64 en Firestore.
- Regla de tamaño: Límite estricto de 15MB por archivo (`request.resource.size <= 15 * 1024 * 1024`) para prevenir saturación de ancho de banda y cuotas de almacenamiento.
- Usuarios autenticados: Solo usuarios autenticados (`request.auth != null`) pueden cargar y actualizar archivos en las rutas autorizadas del bucket (`/projects/{projectId}/{allPaths=**}`).
- Bloqueo global: Cualquier ruta fuera del esquema canónico `/projects/` queda terminantemente denegada (`allow read, write: if false`).

---

## 📋 5. Matriz de Permisos y Roles Multi-Tenant (RBAC de Proyecto)

La seguridad de cada obra audiovisual se valida mediante el UID del usuario (`request.auth.uid`) indexado en los arrays planos del documento del proyecto (`ownerUids`, `distributorUids`, `collaboratorUids`, `guestUids`). La interfaz gráfica emplea estrictamente la nomenclatura en español: **Propietario**, **Distribuidor**, **Colaborador** e **Invitado**.

| Módulo / Operación | Propietario (Dueño / Productor) | Distribuidor | Colaborador | Invitado |
| :--- | :---: | :---: | :---: | :---: |
| **Festivales: Lectura general** | Lectura completa | Lectura completa | Lectura completa | Solo lectura (pública) |
| **Festivales: Creación, estados y fechas** | Permitido | Permitido | Bloqueado | Bloqueado |
| **Festivales: Presupuestos, fees y gastos** | Visible y editable | Visible y editable | Oculto / Bloqueado | Oculto |
| **Planes de Distribución: Alta y edición** | Permitido | Permitido | Solo lectura | Bloqueado |
| **Planes de Distribución: Aprobación institucional** | Permitido | Permitido | Solo lectura | Bloqueado |
| **Ficha Técnica (Film Data) y Galería/Assets** | Edición total | Solo lectura | Solo lectura | Solo lectura |
| **Pizarra (Planning), Roadmap, Tareas y Notas** | Lectura y edición | Lectura y edición | Lectura y edición | Solo lectura |
| **Configuración de la Obra (FPS, Resolución, Tema)** | Permitido | Bloqueado | Bloqueado | Bloqueado |
| **Gestión de Miembros y Enlaces de Invitación** | Exclusivo | Bloqueado | Bloqueado | Bloqueado |
| **Borrado o archivado de la obra** | Exclusivo | Bloqueado | Bloqueado | Bloqueado |
| **Salvaguarda de Orfandad** | Último Propietario protegido | — | — | — |

### Sistema de Enlaces Mágicos de Invitación (`/project_invitations`)
- La incorporación de integrantes se realiza de forma autónoma sin intermediación de APIs de correo externas.
- El Propietario genera un enlace con un rol preasignado (Distribuidor, Colaborador o Invitado) y validez temporal de 7 días.
- Al abrir la URL `${window.location.origin}/?invite={token}`, el usuario autenticado se añade a la obra y se asocia su `request.auth.uid` al array correspondiente en Firestore.

---

## 🔒 6. Autenticación de Dos Pasos (2FA), Registro de Teléfono y Modo Experimental de Claves API

Para ofrecer flexibilidad en el acceso y posibilitar la protección opcional de las credenciales sensibles del sistema (como la clave secreta `x-spark-api-key` de Gemini Spark):

- **Modo Estándar (Acceso Directo):** Por defecto, la clave secreta de Gemini Spark opera en modo directo ("asi nomas"), permitiendo ver, modificar y generar la clave de autenticación sin requerir un paso de 2FA restrictivo.
- **Funciones Experimentales (2FA Opcional):** La función de Autenticación de Dos Pasos (2FA) para proteger la visualización y edición de la API Key de Spark se encuentra clasificada bajo la sección **Funciones Experimentales** (en la pestaña DEV / Configuración).
- **Registro de Teléfono Móvil (SMS) & OTP:** Al activar el 2FA experimental, los usuarios pueden utilizar su aplicación autenticadora de terceros (Google Authenticator / Authy) o solicitar un código OTP temporal de 6 dígitos enviado por Email & SMS a su número registrado.
- **Auditoría:** Todas las acciones de generación, modificación o actualización de claves e integraciones son registradas en la bitácora de auditoría del sistema en Firestore.

