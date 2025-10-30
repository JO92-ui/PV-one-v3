// service-worker.js - Service Worker para PV-One PWA
// Permite que la app funcione 100% offline después de la primera carga

// Bump cache versions to force clients to fetch latest index.html (banner removed)
// Bump these values to force clients to refresh cached app shell when we deploy fixes
const CACHE_NAME = 'pv-one-v3.0.2';
const RUNTIME_CACHE = 'pv-one-runtime-v3.0.2';

// Archivos esenciales que se cachean en la instalación
const ESSENTIAL_FILES = [
  './',
  './index.html',
  './web-bridge.js',
  './alarms.bundle.js',
  './script.js',
  './update_alarms_display.js',
  './lib/formulas.js',
  './lib/logic.js',
  './lib/render.js',
  './lib/renderers.js',
  './lib/timepoints.js',
  './lib/ui.js',
  './lib/variablesbuild.js',
  './scripts/loadPlotly.js',
  './scripts/perf.js',
  './src/clinic.js',
  './src/alarms/engine.ts',
  './src/alarms/eval.ts',
  './manifest.json',
  './Logo-ITAMEX.ico',
  './Logo-ITAMEX.svg',
  // App icons (generate with tools/generate-icons.html)
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png'
];

// Archivos externos (CDN) que intentaremos cachear
const EXTERNAL_RESOURCES = [
  'https://cdn.plot.ly/plotly-2.35.3.min.js'
];

// Instalación: cachear archivos esenciales
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching essential files');
        return Promise.allSettled([
          // Cachear archivos locales
          cache.addAll(ESSENTIAL_FILES).catch(err => {
            console.warn('[Service Worker] Some files failed to cache:', err);
            // Intentar uno por uno los que fallaron
            return Promise.allSettled(
              ESSENTIAL_FILES.map(url => cache.add(url).catch(e => console.warn('Failed:', url)))
            );
          }),
          // Cachear recursos externos
          ...EXTERNAL_RESOURCES.map(url => 
            fetch(url)
              .then(response => cache.put(url, response))
              .catch(err => console.warn('[Service Worker] Failed to cache:', url))
          )
        ]);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting(); // Activar inmediatamente
      })
  );
});

// Activación: limpiar cachés antiguos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim(); // Tomar control inmediatamente
      })
  );
});

// Estrategia de fetch: Cache First con Network Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests que no sean GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorar requests de chrome-extension y otros protocolos
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // If the request is a navigation or HTML document, prefer network-first so we always
  // attempt to load the latest `index.html` from the origin (avoids stale app-shell).
  const isNavigate = request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

  if (isNavigate) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // update cache with fresh HTML
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(()=>{});
          }
          return response;
        })
        .catch(() => {
          // fall back to cached HTML if network fails
          return caches.match(request).then(cached => cached || caches.match('./index.html'));
        })
    );
    return;
  }

  // For other resources, keep the original Cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Background update for cross-origin resources
          if (url.origin !== location.origin) {
            fetch(request)
              .then(response => {
                if (response && response.status === 200) {
                  caches.open(RUNTIME_CACHE).then(cache => cache.put(request, response)).catch(()=>{});
                }
              })
              .catch(()=>{});
          }
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') return response;
            const responseToCache = response.clone();
            if (url.origin !== location.origin) {
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseToCache)).catch(()=>{});
            }
            return response;
          })
          .catch((error) => {
            console.warn('[Service Worker] Fetch failed:', request.url, error);
            throw error;
          });
      })
  );
});

// Mensajes desde la app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      })
    );
  }
});

console.log('[Service Worker] Loaded successfully');
