const CACHE_NAME = 'nevimto-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './db.js',
    './favicon.ico',
    './manifest.json',
    './vue.global.js',
    './dexie.mjs'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
