import { useSyncExternalStore } from "react"

// Cookie-consent state, shared by the banner (components/site/cookie-banner.tsx)
// and everything that needs consent before it runs (FingerprintJS in
// lib/device-fingerprint.ts, Google One Tap). Two levels only:
//   "necessary" — auth/session cookies and UI preferences, always on
//   "all"       — plus optional storage/tracking (device fingerprint, One Tap,
//                 and anything you add, e.g. analytics — gate it on
//                 hasOptionalConsent() / useCookieConsent() === "all")
//
// Stored in a first-party cookie, not localStorage, so a server component can
// read it too if a project ever needs to (cookies().get(COOKIE_CONSENT_COOKIE)).
export const COOKIE_CONSENT_COOKIE = "cookie_consent"
export type CookieConsent = "all" | "necessary"

const CHANGE_EVENT = "cookie-consent-change"
const MAX_AGE = 60 * 60 * 24 * 365 // re-ask after a year

// NEXT_PUBLIC_COOKIE_BANNER=false turns the banner off entirely for projects
// that don't need it — consent is then treated as granted, so nothing that's
// gated on it silently stops working.
export const COOKIE_BANNER_ENABLED = process.env.NEXT_PUBLIC_COOKIE_BANNER !== "false"

export function getCookieConsent(): CookieConsent | null {
  if (!COOKIE_BANNER_ENABLED) return "all"
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_CONSENT_COOKIE}=(all|necessary)`))
  return (match?.[1] as CookieConsent | undefined) ?? null
}

export function hasOptionalConsent(): boolean {
  return getCookieConsent() === "all"
}

// null clears the choice, which brings the banner back ("Cookie settings").
export function setCookieConsent(value: CookieConsent | null) {
  document.cookie = value
    ? `${COOKIE_CONSENT_COOKIE}=${value}; path=/; max-age=${MAX_AGE}; samesite=lax`
    : `${COOKIE_CONSENT_COOKIE}=; path=/; max-age=0; samesite=lax`
  // Withdrawing consent: drop Google One Tap's cooldown cookie. Its script
  // can't be unloaded mid-page, but it won't be loaded again.
  if (value === "necessary") document.cookie = "g_state=; path=/; max-age=0"
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => window.removeEventListener(CHANGE_EVENT, onChange)
}

// null on the server and until the visitor has chosen.
export function useCookieConsent(): CookieConsent | null {
  return useSyncExternalStore(subscribe, getCookieConsent, () => null)
}
