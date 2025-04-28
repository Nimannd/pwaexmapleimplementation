const CACHE_NAME = 'zeiterfassung-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json'
    // Icon files removed as they don't exist yet
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Use a more resilient caching approach
                return Promise.all(
                    urlsToCache.map(url => {
                        // Try to add each item to the cache, but don't fail if some can't be cached
                        return cache.add(url).catch(error => {
                            console.error(`Failed to cache: ${url}`, error);
                            // Continue despite the error
                            return Promise.resolve();
                        });
                    })
                );
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached response or fetch from network
                return response || fetch(event.request).catch(error => {
                    console.error('Fetch failed:', error);
                    // Return a simple offline page or response when fetch fails
                    // For API requests or other non-HTML requests, you might want to
                    // return a different response or just let the error propagate
                    if (event.request.mode === 'navigate') {
                        // For page navigations, you could return a simple offline page
                        return new Response('You are offline. Please check your connection.', {
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    }
                    // Let other errors propagate
                    return Promise.reject(error);
                });
            })
    );
});
