const CACHE_VERSION = 'anc-erp-shell-v3.1.0';
const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/config.js',
  '/api-client.js',
  '/legacy-modules.css',
  '/js/ui.js',
  '/js/ads.js',
  '/js/studio.js',
  '/js/operations.js',
  '/js/finance.js',
  '/js/reports.js',
  '/js/users.js',
  '/js/documents.js',
  '/js/settings.js',
  '/app.js',
  '/manifest.webmanifest',
  '/offline.html',
  '/assets/logo-light.png',
  '/assets/logo-dark.png',
  '/assets/mark-light.png',
  '/assets/mark-dark.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(async () => (await caches.match('/index.html')) || caches.match('/offline.html'))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
