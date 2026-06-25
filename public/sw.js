const CACHE_NAME = 'radio-jukebox-v2';

self.addEventListener('install', (event) => {
  /* Pre-cache app shell using scope-relative paths */
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const base = new URL(self.registration.scope).pathname;
      return cache.addAll([base, base + 'index.html']).catch(() => {
        return Promise.allSettled(
          [base, base + 'index.html'].map((url) => cache.add(url).catch(() => {})),
        );
      });
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  /* API calls: network-first with cache fallback */
  if (url.hostname.includes('radio-browser.info')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  /* Static assets: cache-first (handles Vite hashed bundles) */
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }
});
