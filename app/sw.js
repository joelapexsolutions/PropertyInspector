/* Home Buyers Guide SA — Service Worker
   Caches the full app shell so the app works offline after first load.

   UPDATE WORKFLOW — every time you change web-app.js or web-app.css:
   1. Bump the ?v= number on their <link>/<script> tags in index.html
   2. Bump CACHE_VERSION below
   3. Also bump the matching ?v= entries in APP_SHELL below
   That's it — the version-numbered URL guarantees every layer of
   caching (this service worker, the browser's HTTP cache, GitHub
   Pages' CDN) treats it as a brand new file and fetches it fresh. */

const CACHE_VERSION = 'hbg-sa-v5';

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
  './web-app.css?v=5',
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
  './web-app.js?v=5',
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
  if (event.request.method !== 'GET') return;

  const isHTML = event.request.mode === 'navigate'
    || (event.request.headers.get('accept') || '').includes('text/html');

  // The HTML shell: ALWAYS try the network first. This is what makes
  // "I uploaded new files" show up immediately instead of serving a
  // stale cached page. Falls back to cache only when offline.
  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else (JS/CSS/images): cache-first with a background
  // refresh, so repeat visits are instant but still self-heal.
  // Version-numbered files (?v=4 etc.) are simply new cache keys —
  // guaranteed fresh on first request after you bump the number.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
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
