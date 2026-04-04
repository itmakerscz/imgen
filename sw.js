// sw.js
const CACHE_NAME = 'nevimto-v1';
const ASSETS = [
    './',
    './index.html',
    './assets/style.css',
    './app.js',
    './db.js',
    './manifest.json',
    './assets/vue.global.js',
    './assets/dexie.mjs'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Opening cache and adding assets...');
            // We use map to catch which specific file fails
            return Promise.all(
                ASSETS.map((url) => {
                    return fetch(url).then((response) => {
                        if (!response.ok) {
                            throw new Error(`SW: Request failed for ${url} (Status: ${response.status})`);
                        }
                        return cache.put(url, response);
                    }).catch((err) => {
                        console.error(`SW: Failed to cache ${url}`, err);
                    });
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
