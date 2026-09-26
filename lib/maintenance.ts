// Pure path logic for maintenance mode — no DB / server-only imports, so it
// can run in proxy.ts and in the admin form alike.

// Default for the admin-editable exempt list: the public marketing pages.
export const DEFAULT_MAINTENANCE_EXEMPT_PATHS = [
  "/",
  "/features",
  "/changelog",
  "/changelog-template",
  "/privacy",
  "/terms",
]

// Always reachable, whatever the admin saves — otherwise an admin could
// lock themselves out of the sign-in flow needed to turn maintenance off.
export const ALWAYS_OPEN_PATHS = [
  "/maintenance",
  "/login", // includes /login/2fa
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/settings/public", // login page reads the One Tap flag from here
]

// `/foo` matches `/foo` and `/foo/...` but not `/foobar`; `/` matches only `/`.
function matches(pathname: string, prefix: string) {
  const p = prefix.length > 1 ? prefix.replace(/\/+$/, "") : prefix
  return pathname === p || (p !== "/" && pathname.startsWith(p + "/"))
}

export function isMaintenanceExempt(pathname: string, exemptPaths: string[]) {
  return [...ALWAYS_OPEN_PATHS, ...exemptPaths].some((p) => matches(pathname, p))
}
