// e-ManuAI Service Worker v1.0.0
// Three-tier caching strategy for offline-first PWA

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `emanuai-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `emanuai-dynamic-${CACHE_VERSION}`;
const DATA_CACHE = `emanuai-data-${CACHE_VERSION}`;

// Static assets - cache-first strategy
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API endpoints that should use network-first with fallback
const API_PATTERNS = [
  '/functions/v1/ai-assistant',
  '/rest/v1/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('emanuai-') && 
                   name !== STATIC_CACHE && 
                   name !== DYNAMIC_CACHE && 
                   name !== DATA_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - network-first with fallback
  if (API_PATTERNS.some(pattern => url.pathname.includes(pattern))) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Static assets and app shell - cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else - stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Cache-first strategy for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for static asset:', request.url);
    return new Response('Offline - asset not cached', { status: 503 });
  }
}

// Network-first with fallback for API calls
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, checking cache for:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for AI requests
    if (request.url.includes('ai-assistant')) {
      return new Response(JSON.stringify({
        error: 'offline',
        message: 'Jste offline. AI asistent vyžaduje připojení k internetu.'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate for dynamic content
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Check if URL is a static asset
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2', '.ico'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.pathname === '/' ||
         url.pathname === '/index.html';
}

// Handle background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-service-records') {
    event.waitUntil(syncServiceRecords());
  }
});

async function syncServiceRecords() {
  // This would sync offline-created service records when back online
  console.log('[SW] Syncing service records...');
  // Implementation would read from IndexedDB queue and POST to Supabase
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
