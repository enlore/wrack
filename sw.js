/* Wrack service worker — cache-first app shell.
   Bump CACHE on every deploy to force clients to pick up new code. */
const CACHE = "wrack-v20";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./favicon-32.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      // Fetch individually (addAll rejects wholesale) and revalidate with the
      // origin — a plain fetch here can precache a stale copy out of the
      // browser HTTP cache (GH Pages serves max-age=600).
      .then(c => Promise.allSettled(SHELL.map(u =>
        fetch(u, { cache: "no-cache" }).then(res => { if (res.ok) return c.put(u, res); })
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Navigations: cache first, fall back to network, then to the cached shell.
  if (req.mode === "navigate") {
    e.respondWith(
      caches.match("./index.html").then(hit => hit || fetch(req).catch(() => caches.match("./")))
    );
    return;
  }

  // Same-origin assets: cache first, populate on miss.
  if (sameOrigin) {
    e.respondWith(
      caches.match(req).then(hit =>
        hit || fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => hit)
      )
    );
    return;
  }

  // Cross-origin (the webfont): network first, fall back to whatever we cached.
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req))
  );
});

self.addEventListener("message", e => {
  if (e.data === "skipWaiting") self.skipWaiting();
});
