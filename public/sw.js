// Offline mode and push notifications. Registered from app/layout.tsx (production builds only).
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

// --- Push notifications (see lib/push.ts) ---
// Always show a notification for every push. Safari/iOS revokes the
// subscription of sites that receive pushes without showing one.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title || "Notification", {
      body: data.body,
      icon: "/icons/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Same-origin paths only.
  const raw = event.notification.data?.url || "/";
  const url = new URL(raw, location.origin);
  const target = url.origin === location.origin ? url.href : location.origin + "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const open = wins.find((w) => new URL(w.url).origin === location.origin);
      return open ? open.navigate(target).then((c) => c && c.focus()) : self.clients.openWindow(target);
    })
  );
});

// The browser rotated or dropped the subscription: replace it. Not fired on
// every browser (iOS doesn't), so the settings card also re-syncs on app open.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      // oldSubscription is often null (Chrome), and subscribe() needs the VAPID key.
      let options = event.oldSubscription?.options;
      if (!options?.applicationServerKey) {
        const { publicKey } = await (await fetch("/api/push")).json();
        if (!publicKey) return;
        const b64 = (publicKey + "=".repeat((4 - (publicKey.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
        options = { userVisibleOnly: true, applicationServerKey: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) };
      }
      const sub = await self.registration.pushManager.subscribe(options);
      await fetch("/api/push", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub),
      });
    })().catch(() => {})
  );
});
