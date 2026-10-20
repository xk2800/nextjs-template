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

// The visitor's cookie choice, "all" | "necessary" (lib/cookie-consent.ts).
export const COOKIE_CONSENT_COOKIE = 'cookie_consent'

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
