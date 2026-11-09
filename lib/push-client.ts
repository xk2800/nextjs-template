// Browser side of the push example. Server side: lib/push.ts.
// The public key is passed in from a server component (read at runtime), so it
// doesn't have to be present at build time.
// Set when the user turns notifications on here, so a subscription the browser
// dropped can be recreated silently without overriding a deliberate "off".
export const PUSH_FLAG = 'push-enabled'

export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

// The worker is only registered in production builds (app/layout.tsx).
export const getRegistration = () => navigator.serviceWorker.getRegistration('/sw.js')

function keyBytes(base64Url: string) {
  const b64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

export const subscribe = (reg: ServiceWorkerRegistration, publicKey: string) =>
  reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) })

export const saveSubscription = (sub: PushSubscription) =>
  fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub),
  })

// Run on every dashboard open. Push services expire subscriptions on devices
// that stay unused for a while, and the server deletes them on 404/410, so
// without this a user who comes back after days would never get pushes again.
export async function syncPush(publicKey: string) {
  if (!publicKey || !pushSupported() || Notification.permission !== 'granted') return
  const reg = await getRegistration()
  if (!reg) return
  let sub = await reg.pushManager.getSubscription()
  if (!sub && localStorage.getItem(PUSH_FLAG)) sub = await subscribe(reg, publicKey)
  if (sub) await saveSubscription(sub)
}
