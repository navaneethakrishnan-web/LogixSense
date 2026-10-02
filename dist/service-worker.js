/**
 * LogixSense Service Worker
 * - Caches app shell on install (logixsense-v1)
 * - Cache-first for static assets
 * - Network-first for API / serverless function calls
 * - Offline fallback page when network and cache both fail
 */

const CACHE_NAME = 'logixsense-v3';
const OFFLINE_URL = './offline.html';

const APP_SHELL = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './lang.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './locales/en.json',
  './locales/ta.json',
  './locales/hi.json',
  './locales/te.json',
  './locales/kn.json',
  './locales/ml.json',
  'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&family=Noto+Sans+Tamil:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+Telugu:wght@400;600;700&family=Noto+Sans+Kannada:wght@400;600;700&family=Noto+Sans+Malayalam:wght@400;600;700&display=swap',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

const NETWORK_FIRST_PREFIXES = [
  '/.netlify/functions/',
  'https://firestore.googleapis.com',
  'https://identitytoolkit.googleapis.com',
  'https://openrouteservice.org',
  'https://fcm.googleapis.com',
  'https://api.emailjs.com'
];

function isNetworkFirst(url) {
  return NETWORK_FIRST_PREFIXES.some((prefix) =>
    url.href.startsWith(prefix) || url.pathname.includes('/.netlify/functions/')
  );
}

function isStaticAsset(url) {
  if (url.origin !== self.location.origin) {
    return url.href.includes('fonts.googleapis.com') ||
      url.href.includes('unpkg.com/leaflet') ||
      url.href.includes('cdn.jsdelivr.net');
  }
  return /\.(html|css|js|json|png|svg|woff2?)$/i.test(url.pathname) ||
    url.pathname.endsWith('/') ||
    url.pathname.includes('/icons/') ||
    url.pathname.includes('/lang/');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        APP_SHELL.map((url) => cache.add(url).catch(() => console.warn('SW: Failed to cache', url)))
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (isNetworkFirst(url)) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkUpdate = fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => null);

        if (cached) {
          networkUpdate.catch(() => {});
          return cached;
        }

        return networkUpdate.then((response) => {
          if (response) return response;
          if (event.request.mode === 'navigate') return offlineFallback();
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached || (event.request.mode === 'navigate' ? offlineFallback() : undefined))
    )
  );
});

function offlineFallback() {
  return caches.match(OFFLINE_URL).then((page) =>
    page || caches.match('./index.html').then((indexPage) =>
      indexPage || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
    )
  );
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'location-sync') {
    console.log('SW: Background sync triggered for location updates');
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const title = data.notification?.title || 'LogixSense';
  const options = {
    body: data.notification?.body || '',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: data.data?.shipmentId || 'logixsense-notification',
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
