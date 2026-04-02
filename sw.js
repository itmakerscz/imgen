const CACHE_NAME = 'robotizujto-ai-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './data.js',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0'
];

// Instalace - uložení základních souborů
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Strategie: Cache First (pro rychlost a offline)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request).then(fetchRes => {
        // Velké AI modely (ONNX) ukládáme dynamicky při prvním stažení
        if (e.request.url.includes('.onnx') || e.request.url.includes('.json')) {
            return caches.open(CACHE_NAME).then(cache => {
                cache.put(e.request.url, fetchRes.clone());
                return fetchRes;
            });
        }
        return fetchRes;
      });
    })
  );
});
