// Shared client-side device id (FingerprintJS visitorId), computed once and
// cached for the page's lifetime — the library's get() isn't cheap and the
// login form, signup form and deviceCheck.tsx all want the same value.
//
// @fingerprintjs/fingerprintjs is an optional peer dep: if it isn't installed
// (or is blocked in the browser), this resolves to null and callers carry on
// without a fingerprint.
//
// Also resolves to null until the visitor accepts optional cookies (see
// lib/cookie-consent.ts) — not cached, so it starts working the moment they
// do. Without it the sign-in throttle falls back to its per-IP cap.
import { hasOptionalConsent } from "./cookie-consent"

let cached: Promise<string | null> | undefined

export function getVisitorId(): Promise<string | null> {
  if (!hasOptionalConsent()) return Promise.resolve(null)
  cached ??= (async () => {
    try {
      const FingerprintJS = (await import("@fingerprintjs/fingerprintjs")).default
      const { visitorId } = await (await FingerprintJS.load()).get()
      return visitorId || null
    } catch {
      return null
    }
  })()
  return cached
}
