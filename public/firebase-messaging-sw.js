importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  "projectId": "gen-lang-client-0341676723",
  "appId": "1:938854403958:web:8f2f406042bf675420b457",
  "apiKey": "AIzaSyCGdJEDytgNuk3_AoOyh_4KvI7_WGJQJ_c",
  "authDomain": "gen-lang-client-0341676723.firebaseapp.com",
  "messagingSenderId": "938854403958",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Festis Cardigan';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/images/favicon.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

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

