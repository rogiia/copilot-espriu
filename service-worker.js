const CACHE_NAME = 'copilot-espriu-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/js/main.js',
  '/js/ollama-client.js',
  '/js/text-parser.js',
  '/js/autocomplete.js',
  '/manifest.json'
];

const CDN_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap',
  'https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll([...STATIC_ASSETS, ...CDN_ASSETS]);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip non-HTTP/HTTPS schemes (chrome-extension, moz-extension, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip Ollama API requests (always go to network)
  if (request.url.includes('localhost:11434')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses or non-basic types
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Only cache HTTP/HTTPS requests
            const responseUrl = new URL(response.url);
            if (!responseUrl.protocol.startsWith('http')) {
              return response;
            }
            
            // Clone the response before caching
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
            
            return response;
          });
      })
      .catch(() => {
        // Return offline fallback for HTML requests
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      })
  );
});