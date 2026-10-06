// Offline mode. Registered from app/layout.tsx (production builds only).
// - Pages in OFFLINE_PAGES are saved after each visit and shown when offline.
// - Any other page load that fails offline gets the "You're offline" page below.

// Public pages only. Never /dashboard or /api: the next person on a shared
// device could see them. Copies are fetched signed out (no cookies), so they
// never contain the visitor's session.
const OFFLINE_PAGES = ["/", "/features", "/changelog", "/privacy", "/terms"];

// Bump to drop every saved page and asset on the next visit.
const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
// ponytail: oldest-first trim, since each deploy adds new hashed files. Use
// per-build cache names if 300 isn't enough to cover one deploy's assets.
const MAX_ASSETS = 300;

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>You're offline</title>
<style>
  :root { color-scheme: light dark; --bg: #fff; --fg: #0a0a0a; --muted: #737373; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0a0a0a; --fg: #fafafa; --muted: #a3a3a3; } }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px;
    box-sizing: border-box; background: var(--bg); color: var(--fg);
    font-family: system-ui, -apple-system, sans-serif; text-align: center; }
  p { color: var(--muted); }
  button { font: inherit; padding: 0.5em 1.25em; border-radius: 6px; border: 0;
    background: var(--fg); color: var(--bg); cursor: pointer; }
</style>
</head>
<body>
<main>
  <h1>You're offline</h1>
  <p>Check your connection. This page reloads when you're back online.</p>
  <button onclick="location.reload()">Try again</button>
</main>
<script>addEventListener('online', () => location.reload())</script>
</body>
</html>`;

const offlinePage = () =>
  new Response(OFFLINE_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });

async function savePage(path) {
  const res = await fetch(path, { credentials: "omit", referrer: "" });
  // Skip errors and redirects (e.g. maintenance mode sending it to /maintenance).
  if (res.ok && !res.redirected) await (await caches.open(PAGES)).put(path, res);
}

// /_next/static files are content-hashed, so a cached copy never goes stale.
async function staticAsset(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) {
    await cache.put(request, res.clone());
    const keys = await cache.keys();
    if (keys.length > MAX_ASSETS) await Promise.all(keys.slice(0, keys.length - MAX_ASSETS).map((k) => cache.delete(k)));
  }
  return res;
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== PAGES && n !== ASSETS).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(staticAsset(request));
    return;
  }
  if (request.mode !== "navigate") return;

  const saved = OFFLINE_PAGES.includes(url.pathname);
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (saved && res.ok) event.waitUntil(savePage(url.pathname).catch(() => {}));
        return res;
      })
      .catch(async () => (saved && (await caches.match(url.pathname, { cacheName: PAGES }))) || offlinePage())
  );
});
