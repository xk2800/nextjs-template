// Shared cookie/header names used by both client components and server/auth.ts
// — no "server-only" guard, since both sides need them.

// Stashes the page a social sign-in was initiated from, so the login-activity
// log shows the real referrer instead of the OAuth provider's own domain
// (e.g. accounts.google.com) once the browser redirects back.
export const LOGIN_REFERRER_COOKIE = 'login_referrer'

// Carries the client's FingerprintJS visitorId on /sign-in/email and
// /sign-up/email requests — the key for the per-device abuse throttle
// (see lib/auth-throttle.ts). A header, not a cookie, so it's only sent on
// the auth calls that need it, not every request.
export const DEVICE_FINGERPRINT_HEADER = 'x-device-fingerprint'

// The visitor's cookie choice (lib/cookie-consent.ts): "all", "necessary", or
// a comma list of the purposes they ticked under "Customize", e.g.
// "fingerprint" — one choice per purpose, as regulators like the CNIL expect.
export const COOKIE_CONSENT_COOKIE = 'cookie_consent'

// "fingerprint": FingerprintJS device id (new-device alerts, sign-in throttle,
// shared-device detection, admin Devices card). "onetap": Google One Tap,
// whose script may set Google's own cookies.
export type ConsentPurpose = 'fingerprint' | 'onetap'
export const CONSENT_PURPOSES: ConsentPurpose[] = ['fingerprint', 'onetap']

// Version of the consent wording (banner text + privacy page purposes),
// stored with each consent record (consent_log.version) so you can show which
// text a user agreed to. Bump it when that wording changes materially.
export const CONSENT_VERSION = 1

// A well-formed cookie_consent value: "all", "necessary", or a comma list of
// known purposes. Used to validate what the client sends to app/api/consent.
export function isValidConsent(value: unknown): value is string {
  if (value === 'all' || value === 'necessary') return true
  if (typeof value !== 'string' || !value) return false
  const parts = value.split(',')
  return new Set(parts).size === parts.length && parts.every((p) => (CONSENT_PURPOSES as string[]).includes(p))
}

// Does a cookie_consent value allow this purpose? Plain function, no React,
// so route handlers can use it too (app/api/device-check).
export function consentAllows(value: string | null | undefined, purpose: ConsentPurpose): boolean {
  if (value === 'all') return true
  if (!value || value === 'necessary') return false
  return value.split(',').includes(purpose)
}

// Consent mode, set by proxy.ts from the admin's System Settings toggle
// ("1" = consent required, "0" = not). Read by lib/cookie-consent.ts.
export const CONSENT_REQUIRED_COOKIE = 'consent_required'

// FingerprintJS signals that are never sent or stored. Accessibility
// preferences can hint at a disability (GDPR Art. 9 health data); colorGamut
// mostly tracks display hardware but is read alongside them. Filtered on the
// client (lib/device-fingerprint.ts) and again on the server
// (app/api/device-check), since the client can't be trusted.
export const EXCLUDED_SIGNALS = new Set([
  'reducedMotion', 'reducedTransparency', 'contrast', 'forcedColors',
  'invertedColors', 'monochrome', 'colorGamut',
])
