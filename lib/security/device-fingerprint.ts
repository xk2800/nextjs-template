// Shared client-side device id (FingerprintJS visitorId), computed once and
// cached for the page's lifetime — the library's get() isn't cheap and the
// login form, signup form and deviceCheck.tsx all want the same value.
//
// If @fingerprintjs/fingerprintjs fails to load (e.g. it's blocked in the
// browser), this resolves to null and callers carry on without a fingerprint.
//
// Also resolves to null until the visitor consents to the "fingerprint"
// purpose (see lib/cookie-consent.ts) — not cached, so it starts working the
// moment they do. Without it the sign-in throttle falls back to its per-IP cap.
import { hasConsentFor } from "./cookie-consent"
import { EXCLUDED_SIGNALS } from "./cookie-names"

type Fingerprint = { visitorId: string; signals: Record<string, unknown> }

let cached: Promise<Fingerprint | null> | undefined

// The last computed id is also kept in localStorage (only while consent is
// given), so that when consent is withdrawn later — usually on another page
// load — deviceCheck.tsx can ask the server to delete that device's record
// without fingerprinting the browser again.
const STORAGE_KEY = "device-visitor-id"

// Canvas/WebGL/audio values run to tens of KB (canvas is image data URLs).
// Past this size a signal is stored as its hash — enough to compare devices,
// useless to read anyway.
const MAX_SIGNAL_CHARS = 500

function fingerprint(): Promise<Fingerprint | null> {
  if (!hasConsentFor("fingerprint")) return Promise.resolve(null)
  cached ??= (async () => {
    try {
      const FingerprintJS = await import("@fingerprintjs/fingerprintjs")
      // monitoring: false — otherwise ~0.1% of loads ping openfpcdn.io for
      // install stats, sending the visitor's IP to a third party.
      const { visitorId, components } = await (await FingerprintJS.load({ monitoring: false })).get()
      if (!visitorId) return null
      try {
        localStorage.setItem(STORAGE_KEY, visitorId)
      } catch {
        // No localStorage — withdrawal just can't clean up this device's row.
      }
      const signals: Record<string, unknown> = {}
      for (const [name, component] of Object.entries(components)) {
        if (EXCLUDED_SIGNALS.has(name)) continue
        const value = "error" in component ? { error: String(component.error) } : component.value
        const json = JSON.stringify(value) ?? "null"
        signals[name] = json.length > MAX_SIGNAL_CHARS ? { hash: FingerprintJS.murmurX64Hash128(json) } : value
      }
      return { visitorId, signals }
    } catch {
      return null
    }
  })()
  return cached
}

export async function getVisitorId(): Promise<string | null> {
  return (await fingerprint())?.visitorId ?? null
}

// The raw signals behind the visitorId, for the admin user page (sent by
// deviceCheck.tsx). Same consent gate as getVisitorId().
export async function getDeviceSignals(): Promise<Record<string, unknown> | null> {
  return (await fingerprint())?.signals ?? null
}

export function getStoredVisitorId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearStoredVisitorId() {
  cached = undefined
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore — nothing stored then
  }
}
