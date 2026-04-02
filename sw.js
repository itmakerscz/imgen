// sw.js
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './data.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Interní soubory uložíme normálně
      await cache.addAll(ASSETS);
      // Externí soubory uložíme v režimu 'no-cors'
      const crossOriginAssets = [
        'https://cdn.tailwindcss.com',
        'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0'
      ];
      return Promise.all(
        crossOriginAssets.map(url => 
          fetch(url, {mode: 'no-cors'}).then(res => cache.put(url, res))
        )
      );
    })
  );
});
