/* Home Buyers Guide SA — Service Worker
   Caches the full app shell so the app works offline after first load.
   To push an update to installed users: bump CACHE_VERSION, upload, done. */

const CACHE_VERSION = 'hbg-sa-v2';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  // CSS (exact filenames referenced by index.html)
  './styles.css',
  './assessment-report.css',
  './calculator.css',
  './pdf-report.css.css',
  './premium-styles.css',
  './help-guide.css',
  './onboarding.css',
  './theme.css',
  './web-app.css',
  // JS (exact filenames referenced by index.html)
  './onboarding.js',
  './app.js',
  './assessment-guidance.js',
  './checklist.js',
  './cost-calculator.js',
  './help-guide.js',
  './maps-integration.js',
  './pdf-report-generator.js',
  './photo-manager.js',
  './premium-integration.js',
  './premium-system.js',
  './property-data.js',
  './scoring.js',
  './web-app.js',
  // Images
  './Images/app_banner.png',
  // External CDN libraries
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Serve from cache, refresh in background (stale-while-revalidate)
        fetch(event.request).then((response) => {
          if (response && response.ok) {
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, response));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(event.request).then((response) => {
        if (response && response.ok && event.request.url.startsWith('http')) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
