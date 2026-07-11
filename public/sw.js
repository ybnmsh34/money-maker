const CACHE_NAME = 'devutils-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/tools/json-formatter.html',
    '/tools/base64-converter.html',
    '/tools/uuid-generator.html',
    '/tools/regex-tester.html',
    '/tools/hash-generator.html',
    '/tools/color-converter.html',
    '/tools/lorem-ipsum-generator.html',
    '/tools/markdown-preview.html',
    '/tools/password-generator.html',
    '/tools/url-encoder.html',
    '/tools/timestamp-converter.html',
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request).then((fetchResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
    );
});
