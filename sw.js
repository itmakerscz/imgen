const CACHE_NAME = 'ai-wasm-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './data.js',
  './manifest.json'
];

// Instalace základních souborů
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Inteligentní odchytávání požadavků (Fetching)
self.addEventListener('fetch', (event) => {
  // Ignorujeme chrome-extension a jiné protokoly
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        // Pokud jde o model (.onnx, .json, .wasm) nebo knihovny, ulož je do cache
        if (
          event.request.url.includes('.onnx') || 
          event.request.url.includes('.json') || 
          event.request.url.includes('.wasm') ||
          event.request.url.includes('cdn.jsdelivr.net')
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(err => {
        console.error("PWA Fetch failed:", err);
      });
    })
  );
});
