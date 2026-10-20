import { useSyncExternalStore } from "react"
import {
  COOKIE_CONSENT_COOKIE,
  CONSENT_REQUIRED_COOKIE,
  CONSENT_PURPOSES,
  consentAllows,
  type ConsentPurpose,
} from "./cookie-names"

// Server code (proxy.ts, route handlers) imports these from cookie-names.ts
// instead: this module uses a React hook, which server modules can't import.
export { COOKIE_CONSENT_COOKIE, CONSENT_REQUIRED_COOKIE, CONSENT_PURPOSES, type ConsentPurpose }

// Cookie-consent state, shared by the banner (components/site/cookie-banner.tsx)
// and everything that needs consent before it runs. One choice per purpose:
//   "fingerprint" — FingerprintJS device id (lib/device-fingerprint.ts)
//   "onetap"      — Google One Tap (components/auth/oneTap.tsx)
// Gate on hasConsentFor() / useConsentFor(). useCookieConsent() summarises:
//   "all"       — every purpose accepted (gate your own analytics on this)
//   "necessary" — none accepted
//   "custom"    — some, picked under "Customize"
//
// Stored in a first-party cookie, not localStorage, so a server component can
// read it too if a project ever needs to (cookies().get(COOKIE_CONSENT_COOKIE)).
//
// When consent isn't required (CONSENT_REQUIRED_COOKIE = "0") there's no
// banner and everything gated on consent runs as if the visitor accepted.
export type CookieConsent = "all" | "necessary" | "custom"

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

// The raw cookie value, or null before a choice. "all" when consent isn't required.
function readConsent(): string | null {
  if (!isConsentRequired()) return "all"
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_CONSENT_COOKIE}=([a-z,]+)`))
  return match?.[1] ?? null
}

export function getCookieConsent(): CookieConsent | null {
  const value = readConsent()
  if (value === null) return null
  if (value === "all" || value === "necessary") return value
  return "custom"
}

export function hasConsentFor(purpose: ConsentPurpose): boolean {
  return consentAllows(readConsent(), purpose)
}

// Every purpose accepted — what your own analytics etc. should gate on.
export function hasOptionalConsent(): boolean {
  return getCookieConsent() === "all"
}

// "all" / "necessary", or the list of purposes ticked under "Customize".
// null clears the choice, which brings the banner back ("Cookie settings").
export function setCookieConsent(value: "all" | "necessary" | ConsentPurpose[] | null) {
  const stored = Array.isArray(value)
    ? value.length === 0
      ? "necessary"
      : CONSENT_PURPOSES.every((p) => value.includes(p))
        ? "all"
        : value.join(",")
    : value
  document.cookie = stored
    ? `${COOKIE_CONSENT_COOKIE}=${stored}; path=/; max-age=${MAX_AGE}; samesite=lax`
    : `${COOKIE_CONSENT_COOKIE}=; path=/; max-age=0; samesite=lax`
  // One Tap declined or withdrawn: drop Google's cooldown cookie. Its script
  // can't be unloaded mid-page, but it won't be loaded again.
  if (stored && !consentAllows(stored, "onetap")) document.cookie = "g_state=; path=/; max-age=0"
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

// Live per-purpose consent. false on the server and until the visitor chooses.
export function useConsentFor(purpose: ConsentPurpose): boolean {
  return useSyncExternalStore(subscribe, () => hasConsentFor(purpose), () => false)
}

// For UI that only exists in consent mode (banner, "Cookie settings" link).
// The env default on the server, the proxy-set cookie after hydration.
export function useConsentRequired(): boolean {
  return useSyncExternalStore(subscribe, isConsentRequired, () => COOKIE_BANNER_ENABLED)
}
