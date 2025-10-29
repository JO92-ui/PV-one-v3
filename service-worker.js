// service-worker.js - Service Worker para PV-One PWA
// Permite que la app funcione 100% offline después de la primera carga

// Bump cache versions to force clients to fetch latest index.html (banner removed)
const CACHE_NAME = 'pv-one-v3.0.1';
const RUNTIME_CACHE = 'pv-one-runtime-v3.0.1';

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
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Si está en caché, devolver (OFFLINE-FIRST)
        if (cachedResponse) {
          // En background, actualizar caché si es recurso externo
          if (url.origin !== location.origin) {
            fetch(request)
              .then(response => {
                if (response && response.status === 200) {
                  caches.open(RUNTIME_CACHE).then(cache => cache.put(request, response));
                }
              })
              .catch(() => {}); // Ignorar errores en background
          }
          return cachedResponse;
        }
        
        // Si no está en caché, intentar fetch
        return fetch(request)
          .then((response) => {
            // No cachear respuestas inválidas
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
            // Clonar respuesta (solo se puede leer una vez)
            const responseToCache = response.clone();
            
            // Cachear recursos externos en runtime cache
            if (url.origin !== location.origin) {
              caches.open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, responseToCache))
                .catch(() => {}); // Ignorar errores de caché
            }
            
            return response;
          })
          .catch((error) => {
            console.warn('[Service Worker] Fetch failed:', request.url, error);
            
            // Si es un HTML, devolver página offline personalizada
            if (request.headers.get('accept').includes('text/html')) {
              return new Response(
                `<!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>PV-One - Offline</title>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                           display: flex; align-items: center; justify-content: center; height: 100vh; 
                           margin: 0; background: #f5f5f7; text-align: center; padding: 20px; }
                    .container { max-width: 400px; }
                    h1 { color: #002b5c; margin-bottom: 10px; }
                    p { color: #666; line-height: 1.6; }
                    .icon { font-size: 64px; margin-bottom: 20px; }
                    button { background: #1f6fff; color: white; border: none; padding: 12px 24px; 
                             border-radius: 8px; font-size: 16px; cursor: pointer; margin-top: 20px; }
                    button:hover { background: #0056d6; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="icon">📡</div>
                    <h1>Offline</h1>
                    <p>The requested resource could not be loaded. Some features may be unavailable while offline.</p>
                    <p>Most of the app works offline. You only need internet the first time to load Plotly.js.</p>
                    <button onclick="location.reload()">Retry</button>
                    <button onclick="location.href='./index.html'" style="background:#6c757d">Back to Home</button>
                  </div>
                </body>
                </html>`,
                {
                  status: 200,
                  statusText: 'OK',
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            }
            
            // Para otros recursos, devolver error
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
