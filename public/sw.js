// public/sw.js
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const outputArray = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) outputArray[i] = raw.charCodeAt(i);
  return outputArray;
}

const CACHE_VERSION = 'v1';
const APP_CACHE = `app-${CACHE_VERSION}`;
// const APP_ASSETS = ['/', '/offline.html'];
const APP_ASSETS = ['/',
   '/offline.html',
    '/icons-192x192.png', '/icons-512x512.png', 
    // '/globals.css'
  ];


self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(APP_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== APP_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/auth/')) return; // ✅ skip auth calls

  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cache = await caches.open(APP_CACHE);
      const cached = await cache.match(event.request);
      return cached || cache.match('/offline.html');
    })
  );
});


self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json(); // try JSON
  } catch {
    data = { title: 'Notification', body: event.data.text() }; // fallback to plain text
  }

 const options = {
  body: data.body,
  icon: `${self.location.origin}/icons-192x192.png`,
  badge: `${self.location.origin}/icons-192x192.png`,
  data: data.data || {},
};

  event.waitUntil(self.registration.showNotification(data.title || 'Notification', options));
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const hadWindow = clientsArr.some((client) => {
        if (client.url === url && 'focus' in client) { client.focus(); return true; }
        return false;
      });
      if (!hadWindow && self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});


self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    const VAPID_PUBLIC_KEY = 'BNmCYeYu3wd7J9gHUh7gYR74KMVntSM5GM6s9mK29unUyM02KdMDSA38LZvX2Hlus586JSQNbhUYhaZQC0NAiaQ';
    const reg = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reg.toJSON()),
    });
  })());
});
