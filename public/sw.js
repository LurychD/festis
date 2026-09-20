// Service Worker para Festis: Cardigan
const CACHE_NAME = 'festis-cardigan-v3';

// Instalación: tomar control de inmediato
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activación: eliminar TODOS los cachés previos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

// Fetch: No interceptar archivos estáticos o HTML para evitar versiones desactualizadas tras un nuevo deploy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api') || !url.protocol.startsWith('http')) {
    return;
  }
  // Permitir la navegación estándar por red sin almacenar en caché la página
});

// Manejo de clic en notificaciones locales / push
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const festivalId = notifData.festivalId || notifData.fId;
  const view = notifData.view || (festivalId ? 'details' : undefined);

  let targetUrl = notifData.url || notifData.link;
  if (!targetUrl) {
    if (festivalId) {
      targetUrl = `/?festivalId=${encodeURIComponent(festivalId)}`;
    } else if (view) {
      targetUrl = `/?view=${encodeURIComponent(view)}`;
    } else {
      targetUrl = '/';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            festivalId: festivalId,
            view: view,
            data: notifData,
            url: targetUrl
          });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

