// Offline mode: a page load that fails because there's no network gets the
// page below instead of the browser's error screen. Nothing is cached, so no
// signed-in data is left on the device and deploys never serve stale pages.
// Registered from app/layout.tsx (production builds only).

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

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_HTML, { headers: { "content-type": "text/html; charset=utf-8" } })
    )
  );
});
