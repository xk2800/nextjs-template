import { useSyncExternalStore } from "react"
import { COOKIE_CONSENT_COOKIE, CONSENT_REQUIRED_COOKIE } from "./cookie-names"

// Server code (proxy.ts, route handlers) imports these from cookie-names.ts
// instead: this module uses a React hook, which server modules can't import.
export { COOKIE_CONSENT_COOKIE, CONSENT_REQUIRED_COOKIE }

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
//
// When consent isn't required (CONSENT_REQUIRED_COOKIE = "0") there's no
// banner and everything gated on consent runs as if the visitor accepted.
export type CookieConsent = "all" | "necessary"

const CHANGE_EVENT = "cookie-consent-change"
const MAX_AGE = 60 * 60 * 24 * 365 // re-ask after a year

// Fallback when the consent_required cookie is missing (server render, or a
// project whose proxy.ts predates it): NEXT_PUBLIC_COOKIE_BANNER=false means
// consent isn't required.
export const COOKIE_BANNER_ENABLED = process.env.NEXT_PUBLIC_COOKIE_BANNER !== "false"

export function isConsentRequired(): boolean {
  if (typeof document === "undefined") return COOKIE_BANNER_ENABLED
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_REQUIRED_COOKIE}=([01])`))
  return match ? match[1] === "1" : COOKIE_BANNER_ENABLED
}

export function getCookieConsent(): CookieConsent | null {
  if (!isConsentRequired()) return "all"
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

// For UI that only exists in consent mode (banner, "Cookie settings" link).
// The env default on the server, the proxy-set cookie after hydration.
export function useConsentRequired(): boolean {
  return useSyncExternalStore(subscribe, isConsentRequired, () => COOKIE_BANNER_ENABLED)
}
