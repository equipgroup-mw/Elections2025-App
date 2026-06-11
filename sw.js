/* Elections by Equip - Service Worker v1 */

const CACHE_NAME = "elections-v27";

const PRECACHE_URLS = [
  "./",
  "./desktop.html",
  "./mobile.html",
  "./manifest.json",
  "./data/mapLogo.png",
  "./data/malawi_districts.geojson",
  "./data/1994presRegional.csv",
  "./data/1999presRegional.csv",
  "./data/2004presRegional.csv",
  "./data/2009presRegional.csv",
  "./data/2014presRegional.csv",
  "./data/2019presRegional.csv",
  "./data/2020presRegional.csv",
  "./data/2025presRegional.csv"
];

// Install: open cache and store pre-cached assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {
      /* non-critical; app works without pre-cache */
    })
  );
});

// Activate: clean old caches and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML, cache-first for everything else
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  if (request.mode === "navigate" || url.pathname.endsWith(".html")) {
    // Network-first for HTML pages
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || new Response("Offline", { status: 503 })))
    );
  } else {
    // Cache-first for assets (CSS, JS, images, CSVs, GeoJSON)
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
