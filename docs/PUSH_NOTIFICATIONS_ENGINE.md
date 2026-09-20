# Motor de Notificaciones Push, Recordatorios y Alertas de Vencimiento — Guía Técnica

Este documento especifica la arquitectura del sistema de alertas en tiempo real, notificaciones Web Push a través de Firebase Cloud Messaging (FCM) y la lógica de programación de recordatorios automáticos en **Festis Cardigan**.

---

## 🔔 1. Visión General del Motor de Notificaciones

En la distribución de festivales de cine, perder una fecha límite de inscripción (*Early Bird*, *Regular* o *Late Deadline*) o no enviar a tiempo la copia de exhibición (DCP) para un festival seleccionado puede resultar en la descalificación de la película.

El subsistema de notificaciones de **Festis Cardigan** opera en tres niveles de alerta:
1. **Notificaciones In-App (Banner & Toast):** Avisos dentro de la interfaz activa del usuario.
2. **Notificaciones del Navegador (Browser Web Notifications):** Alertas emitiendo sonido y notificación nativa del sistema operativo.
3. **Firebase Cloud Messaging (FCM Web Push):** Alertas enviadas en segundo plano aun cuando la pestaña o aplicación se encuentre cerrada.

---

## 🛠️ 2. Hook de Notificaciones (`useNotificationEngine.ts`)

Ubicación: `src/hooks/useNotificationEngine.ts`

El custom hook `useNotificationEngine` administra el ciclo de vida de los permisos de notificación del navegador, el registro de Service Workers y la evaluación constante de vencimientos de festivales.

### Permisos y Configuración VAPID

Para habilitar notificaciones push mediante FCM, la aplicación utiliza la clave pública VAPID definida en la variable de entorno `VITE_FCM_VAPID_KEY`:

```typescript
// Fragmento simplificado del registro FCM en useNotificationEngine.ts
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../firebase';

export const initializeFCM = async () => {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.warn('Este navegador no soporta notificaciones Web Push.');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('El usuario rechazó los permisos de notificación.');
  }

  const messaging = getMessaging(app);
  const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY;

  const currentToken = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  });

  return currentToken;
};
```

---

## ⏰ 3. Lógica de Detección de Vencimientos y Próximos Festivales

El motor analiza periódicamente el catálogo de festivales buscando tres eventos críticos:

- **Alerta de Cierre de Inscripciones (Deadline Warning):** Notifica cuando un festival en estado "Borrador" o "En Evaluación" se encuentra a **7, 3 o 1 días** de su fecha de vencimiento (`deadline`).
- **Alerta de Fecha de Notificación de Jurados (Notification Date):** Avisa el día en que la organización del festival anunciará la selección oficial (`notificationDate`).
- **Alerta de Tareas Pendientes (Kanban Deadline):** Recuerda las tareas operativas asignadas al usuario cuyo plazo expira en las próximas 24 horas.

```
       ┌─────────────────────────────────────────────────────────┐
       │             Intervalo de Evaluación (24h)              │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │     Calcular Días Restantes: `deadline - Date.now()`     │
       └────────────────────────────┬────────────────────────────┘
                                    │
                      ┌─────────────┴─────────────┐
                      │                           │
                      ▼                           ▼
            (Días <= 3)                         (Días > 3)
            Emitir Alerta Push                 Sin Acción
```

---

## 📲 4. Service Worker en Segundo Plano (`public/firebase-messaging-sw.js`)

Para recibir notificaciones cuando el usuario no tiene la aplicación abierta en su pantalla, el archivo Service Worker intercepta los mensajes `push` entrantes del servidor FCM de Firebase:

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "...",
  projectId: "festis-cardigan",
  messagingSenderId: "..."
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title || 'Festis Cardigan - Recordatorio';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png',
    badge: '/icon.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

---

## ⚙️ 5. Configuración de Preferencias por Usuario

Los usuarios pueden personalizar los tipos de alertas que desean recibir dentro de la vista de Configuración:
- Habilitar/Deshabilitar alertas de sonido.
- Activar/Desactivar recordatorios por correo electrónico.
- Filtrar alertas por nivel de prioridad del festival (Solo Clase A, o Todos los Festivales).
