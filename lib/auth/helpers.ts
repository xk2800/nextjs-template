import "server-only"
import { cache } from "react"
import { auth } from "../../server/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "../../server/db"
import { users } from "../../server/db/schema"
import { eq } from "drizzle-orm"
import { hasRole, normalizeCallbackUrl } from "./pure"

// Pure helpers live in ./pure so tests can import them without server-only/db.
export { hasRole, normalizeCallbackUrl }

/**
 * Get current session (server-side only)
 * Returns session data or null if not authenticated
 *
 * Wrapped in React's cache() so the layout and page (both of which call
 * requireAuth per request) share one auth.api.getSession call instead of two.
 */
export const getCurrentSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  return session
})

/**
 * Require authentication - redirect to login if not authenticated
 * Use in server components/layouts that need protection
 *
 * Wrapped in cache() so the layout, page, and any admin layout that all call
 * requireAuth per request share one banned-status DB lookup instead of several.
 */
export const requireAuth = cache(async () => {
  const session = await getCurrentSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check if user is banned
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (user[0]?.banned) {
    // Sign out the user
    await auth.api.signOut({
      headers: await headers()
    })
    redirect('/login?error=account_banned')
  }

  // The session cookie caches the user for 5 minutes, so a role changed after
  // sign-in (first-admin promotion, admin demotion) lags behind. We already have
  // the fresh row here, so take the role from it.
  return { ...session, user: { ...session.user, role: user[0]?.role ?? session.user.role } }
})

/**
 * Require specific role - throw error if user doesn't have it
 */
export async function requireRole(requiredRole: 'user' | 'admin') {
  const session = await requireAuth()

  if (!hasRole(session.user.role, requiredRole)) {
    redirect('/dashboard')
  }

  return session
}
