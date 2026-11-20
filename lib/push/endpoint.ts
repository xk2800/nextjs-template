// Web Push endpoints are stored per user and POSTed to by the server, so only
// the browsers' real push services are allowed (blocks SSRF via a crafted
// endpoint). No server-only imports: safe to unit test.
const PUSH_HOSTS = [
  "fcm.googleapis.com", // Chrome, Edge, Brave, Opera (Android and desktop)
  "updates.push.services.mozilla.com", // Firefox
]
const PUSH_HOST_SUFFIXES = [
  ".push.services.mozilla.com",
  ".notify.windows.com", // legacy Edge/Windows
  ".push.apple.com", // Safari
]

export function isPushEndpointAllowed(endpoint: string): boolean {
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    return false
  }
  if (url.protocol !== "https:" || url.username || url.password) return false
  if (url.port && url.port !== "443") return false
  const host = url.hostname
  return PUSH_HOSTS.includes(host) || PUSH_HOST_SUFFIXES.some((s) => host.endsWith(s))
}

// p256dh is 87 and auth 22 base64url chars; 200 leaves room without allowing blobs.
export const isPushKey = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 200
