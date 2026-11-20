// No server-only/db imports: safe to unit test.
/**
 * Check if user has specific role
 */
export function hasRole(userRole: string | null | undefined, requiredRole: 'user' | 'admin'): boolean {
  if (!userRole) return false

  if (requiredRole === 'admin') {
    return userRole === 'admin'
  }

  // 'user' role check - every role ('user', 'admin', 'tester') has access
  return userRole === 'user' || userRole === 'admin' || userRole === 'tester'
}

/**
 * Normalize a callbackUrl query param to a same-origin path before it's ever
 * passed to redirect() or an auth form's callbackURL. Guards against open
 * redirects (e.g. /login?callbackUrl=https://evil.com) — anything that
 * doesn't resolve to this app's own origin falls back to /dashboard.
 */
export function normalizeCallbackUrl(value?: string | string[]): string {
  if (typeof value !== 'string' || !value.trim()) return '/dashboard'

  const candidate = value.trim()

  try {
    const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000').origin
    const callbackUrl = new URL(candidate, appOrigin)

    if (callbackUrl.origin !== appOrigin) {
      return '/dashboard'
    }

    return `${callbackUrl.pathname}${callbackUrl.search}${callbackUrl.hash}` || '/dashboard'
  } catch {
    return '/dashboard'
  }
}

/**
 * Would removing `removing` admins (delete, demote or ban) leave none of the
 * `totalAdmins`? Shared by every last-admin guard so the rule lives in one place.
 */
export function wouldRemoveAllAdmins(removing: number, totalAdmins: number): boolean {
  return removing > 0 && removing >= totalAdmins
}
