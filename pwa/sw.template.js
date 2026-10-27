// Lockdown 13 service worker (generated into dist/sw.js at build time).
const VERSION = '__VERSION__';
const CORE_CACHE = `lockdown13-core-${VERSION}`;
const PYTHON_CACHE = 'lockdown13-python-v1'; // big, rarely changes: kept across versions
const CORE_FILES = __CORE_FILES__;
const PYTHON_FILES = __PYTHON_FILES__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const core = await caches.open(CORE_CACHE);
      await core.addAll(CORE_FILES);
      // Python (~12 MB) downloads in the background; a failure must not block install.
      const py = await caches.open(PYTHON_CACHE);
      await Promise.all(
        PYTHON_FILES.map(async (url) => {
          try {
            if (!(await py.match(url))) await py.add(url);
          } catch (e) {
            /* will be cached on first use instead */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('lockdown13-core-') && k !== CORE_CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Page navigations: network first (so updates arrive), cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => (await caches.match(new URL('index.html', self.registration.scope).href)) || Response.error())
    );
    return;
  }

  if (url.origin !== location.origin) {
    // Google Fonts etc.: cache after first successful load
    event.respondWith(
      caches.open(CORE_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
          return res;
        } catch (e) {
          return hit || Response.error();
        }
      })
    );
    return;
  }

  // Same-origin assets: cache first, fill cache as we go.
  event.respondWith(
    caches.match(req).then(async (hit) => {
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) {
        const cacheName = url.pathname.includes('/pyodide/') ? PYTHON_CACHE : CORE_CACHE;
        const copy = res.clone();
        caches.open(cacheName).then((c) => c.put(req, copy));
      }
      return res;
    })
  );
});
