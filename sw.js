// Service Worker for offline support
const CACHE_NAME = 'filetools-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/main.js',
    '/js/tool-common.js',
    '/js/ads.js',
    '/js/analytics.js',
    '/tools/image-converter.html',
    '/tools/image-compressor.html',
    '/tools/image-resizer.html',
    '/tools/image-cropper.html',
    '/tools/bulk-image-converter.html',
    '/tools/image-to-pdf.html',
    '/tools/pdf-compressor.html',
    '/tools/pdf-merge.html',
    '/tools/pdf-split.html',
    '/tools/pdf-to-word.html',
    '/tools/pdf-to-image.html',
    '/tools/word-to-pdf.html',
    '/tools/html-to-pdf.html',
    '/tools/csv-to-json.html',
    '/tools/json-to-csv.html',
    '/tools/qr-code-generator.html',
    '/tools/universal-converter.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .catch((err) => console.log('Cache install failed:', err))
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response or fetch from network
                if (response) {
                    return response;
                }
                
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Cache new resources
                        if (networkResponse.ok && event.request.url.startsWith(self.location.origin)) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => cache.put(event.request, responseToCache));
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Return offline page if everything fails
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});
