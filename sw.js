const CACHE = 'portfolio-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './three-scene.js',
  './assets/logo.glb'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Network-first for html, cache-first for others
  if (req.headers.get('accept')?.includes('text/html')) {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy));
      return res;
    }).catch(() => caches.match(req)));
  } else {
    e.respondWith(caches.match(req).then(c => c || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(cache => cache.put(req, copy));
      return res;
    })));
  }
});


