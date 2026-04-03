const CACHE_NAME = 'robotizujto-v2';
const ASSETS = [
    './',
    './index.html',
    './app.js',
    './data.js',
    './manifest.json',
    './tailwind.min.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    // Necháme Transformers.js řešit vlastní cache pro modely
    if (e.request.url.includes('huggingface.co') || e.request.url.includes('cdn.jsdelivr.net')) return;

    e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request))
    );
});
