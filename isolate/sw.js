/* The Belgravia Roast — service worker.
 *
 * Network-first everywhere: when online, always fetch fresh content (so the
 * café can update menus/offers without anyone getting a stale copy). If the
 * network fails (café Wi-Fi hiccup), fall back to the last cached response so
 * the app shell and menu stay usable. Never cache API/Convex data — that stays
 * live and reactive.
 */
const CACHE = "belgravia-v2";
const SHELL = ["/", "/logo.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GETs on our own origin; leave API calls (Convex etc.) untouched.
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  // Static hashed assets: cache-first is safe (content-addressed filenames).
  if (req.url.includes("/assets/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // Navigations + everything else: network-first with cache fallback.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && req.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => {
          if (hit) return hit;
          // Offline navigation: serve the cached app shell.
          if (req.mode === "navigate") {
            return caches.match("/");
          }
          return Response.error();
        })
      )
  );
});