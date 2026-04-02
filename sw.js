const CACHE_NAME = 'robotizujto-cache-v1';
const ASSETS = ['./', './index.html', './app.js', './data.js', './manifest.json'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    if (!e.request.url.startsWith('http')) return;
    e.respondWith(
        caches.match(e.request).then(cached => {
            return cached || fetch(e.request).then(res => {
                // Ukládáme AI modely a skripty z CDN
                if (res.ok && (e.request.url.includes('.onnx') || e.request.url.includes('cdn.jsdelivr.net'))) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                }
                return res;
            });
        })
    );
});
