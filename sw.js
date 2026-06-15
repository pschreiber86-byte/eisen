/* Eisen Trainingstracker – Service Worker (Offline) */
const CACHE = 'eisen-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req)
        .then(res => {
          // neue, gleich-origin GETs zusätzlich in den Cache legen
          try {
            const url = new URL(req.url);
            if (url.origin === self.location.origin) {
              const copy = res.clone();
              caches.open(CACHE).then(c => c.put(req, copy));
            }
          } catch (_) {}
          return res;
        })
        .catch(() => caches.match('./index.html')); // Navigations-Fallback offline
    })
  );
});
