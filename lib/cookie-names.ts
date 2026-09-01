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
