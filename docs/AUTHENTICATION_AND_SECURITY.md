# Autenticación, Seguridad y Control de Acceso (RBAC) — Guía Técnica

Este documento especifica la arquitectura de autenticación de usuarios, la persistencia de sesiones, la seguridad en Firestore y los mecanismos de bypass para desarrollo local en **Festis Cardigan**.

---

## 🔐 1. Arquitectura de Autenticación (`AuthProvider.tsx`)

Ubicación del Archivo: `src/AuthProvider.tsx`  
Proveedor de Identidad: Firebase Authentication (`GoogleAuthProvider`, `Email/Password`)  
Contexto React: `AuthContext` (disponible globalmente a través del hook `useAuth()`)  

### Ciclo de Vida del Estado de Autenticación

1. **Inicialización, Caché Inmediato y Listener de Estado:**
   Al montarse el `AuthProvider`, se verifica de inmediato si existe una sesión previa o usuario en caché (`cached_firebase_user`, `userEmail`) en `localStorage`. Si existe, la interfaz se inicializa sin demora (`loading = false`), evitando cualquier bloqueo de pantalla en blanco o spinner infinito. Simultáneamente, se registra el observador `onAuthStateChanged` para validar la sesión en segundo plano.

2. **Timeout de Seguridad Ultrarrápido (2.5s):**
   En entornos con restricciones de red o dentro de iFrames de vistas previas (donde las cookies de terceros o websockets de Firebase pueden bloquearse), el temporizador de seguridad se redujo a 2.5 segundos (en lugar de los 30s previos). Si Firebase Auth no responde en 2.5s, el proveedor libera automáticamente el estado de carga (`setLoading(false)`) permitiendo al usuario ingresar a la aplicación o usar el acceso directo.

3. **Acceso Directo y Modo Sin Conexión:**
   Para prevenir bloqueos si los popups de Google están inhabilitados en dispositivos móviles, se habilitó el método `loginAsDirect` que permite autenticación directa como Director (`axeldibarra@gmail.com`) y botones de escape tanto en el Splash Screen como en la pantalla de inicio de sesión.

3. **Autenticación con Google (`loginWithGoogle`):**
   Utiliza la persistencia local explícita (`browserLocalPersistence`) y la autenticación emergente (`signInWithPopup`).
   Al completar el flujo con éxito, extrae el `accessToken` de Google y lo almacena en `localStorage` bajo la clave `google_access_token`.

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
  }
}
```

### Seguridad en Firebase Storage
- Bucket oficial del proyecto: vinculado a `firebase-applet-config.json`.
- Regla de tamaño: Límite estricto de 15MB por archivo para prevenir saturación de ancho de banda y cuotas de almacenamiento.
- Solo usuarios autenticados pueden cargar archivos en las rutas autorizadas del bucket (`projects/{projectId}/*`).

---

## 📋 5. Matriz de Permisos y Roles (RBAC)

| Rol de Usuario | Lectura de Festivales | Edición / Creación | Exportación PDF/Excel | Consola de Depuración |
| :--- | :---: | :---: | :---: | :---: |
| **Invitado (No Autenticado)** | ✅ Solo Lectura | ❌ | ❌ | ❌ |
| **Distribuidor / Miembro** | ✅ | ✅ | ✅ | ❌ |
| **Administrador / Editor Head** | ✅ | ✅ | ✅ | ✅ |
| **Modo Local (Dev Bypass)** | ✅ | ✅ (Local Storage) | ✅ | ✅ |

---

## 🔒 6. Autenticación de Dos Pasos (2FA), Registro de Teléfono y Modo Experimental de Claves API

Para ofrecer flexibilidad en el acceso y posibilitar la protección opcional de las credenciales sensibles del sistema (como la clave secreta `x-spark-api-key` de Gemini Spark):

- **Modo Estándar (Acceso Directo):** Por defecto, la clave secreta de Gemini Spark opera en modo directo ("asi nomas"), permitiendo ver, modificar y generar la clave de autenticación sin requerir un paso de 2FA restrictivo.
- **Funciones Experimentales (2FA Opcional):** La función de Autenticación de Dos Pasos (2FA) para proteger la visualización y edición de la API Key de Spark se encuentra clasificada bajo la sección **Funciones Experimentales** (en la pestaña DEV / Configuración).
- **Registro de Teléfono Móvil (SMS) & OTP:** Al activar el 2FA experimental, los usuarios pueden utilizar su aplicación autenticadora de terceros (Google Authenticator / Authy) o solicitar un código OTP temporal de 6 dígitos enviado por Email & SMS a su número registrado.
- **Auditoría:** Todas las acciones de generación, modificación o actualización de claves e integraciones son registradas en la bitácora de auditoría del sistema en Firestore.

