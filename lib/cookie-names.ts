// Shared between client components (that set these directly via
// document.cookie) and server/auth.ts (that reads them back via
// context.getCookie) — no "server-only" guard, since both sides need it.

// Stashes the page a social sign-in was initiated from, so the login-activity
// log shows the real referrer instead of the OAuth provider's own domain
// (e.g. accounts.google.com) once the browser redirects back.
export const LOGIN_REFERRER_COOKIE = 'login_referrer'
