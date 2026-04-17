// e-ManuAI Service Worker v1.0.2
// Strategies:
//  - Stale-While-Revalidate for static build assets (JS/CSS/fonts)
//  - Network-First (3s timeout) for Supabase REST/Auth/Functions data
//  - Cache-First for tile maps and images
//  - Bypass for Vite dev paths

const CACHE_VERSION = 'v1.0.2';
const STATIC_CACHE = `emanuai-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `emanuai-dynamic-${CACHE_VERSION}`;
const DATA_CACHE = `emanuai-data-${CACHE_VERSION}`;
const TILE_CACHE = `emanuai-tiles-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

const NETWORK_TIMEOUT_MS = 3000;

function shouldBypassCache(url) {
  return (
    url.pathname.startsWith('/node_modules/.vite/') ||
    url.pathname.startsWith('/@vite/') ||
    url.pathname.startsWith('/src/') ||
    url.searchParams.has('v')
  );
}

function isSupabaseDataRequest(url) {
  return (
    url.hostname.endsWith('.supabase.co') &&
    (url.pathname.startsWith('/rest/') ||
      url.pathname.startsWith('/auth/') ||
      url.pathname.startsWith('/functions/'))
  );
}

function isMapTile(url) {
  // OSM-style tile servers: a/b/c.tile.openstreetmap.org, *.basemaps.*, etc.
  return (
    /tile\./i.test(url.hostname) ||
    /basemaps/i.test(url.hostname) ||
    /\/\d+\/\d+\/\d+\.(png|jpg|webp)$/i.test(url.pathname)
  );
}

function isImage(url) {
  return /\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(url.pathname);
}

function isBuildAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    /\.(js|mjs|css|woff2?)$/i.test(url.pathname)
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([STATIC_CACHE, DYNAMIC_CACHE, DATA_CACHE, TILE_CACHE]);
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n.startsWith('emanuai-') && !keep.has(n))
          .map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;
  if (shouldBypassCache(url)) return;

  // Supabase data: network-first with 3s timeout
  if (isSupabaseDataRequest(url)) {
    event.respondWith(networkFirstWithTimeout(request, DATA_CACHE));
    return;
  }

  // Tile maps + images: cache-first
  if (isMapTile(url) || isImage(url)) {
    event.respondWith(cacheFirst(request, isMapTile(url) ? TILE_CACHE : STATIC_CACHE));
    return;
  }

  // Build assets: stale-while-revalidate
  if (isBuildAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // App shell / navigations: stale-while-revalidate via dynamic cache
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithTimeout(request, cacheName) {
  try {
    const res = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT_MS)
      ),
    ]);
    if (res && res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.url.includes('ai-assistant')) {
      return new Response(
        JSON.stringify({ error: 'offline', message: 'Jste offline. AI asistent vyžaduje připojení.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-service-records') {
    event.waitUntil(syncServiceRecords());
  }
});

async function syncServiceRecords() {
  console.log('[SW] Syncing service records...');
}

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
