import "server-only"
import { cache } from "react"
import { auth } from "../../server/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { NextResponse } from "next/server"
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
 * Reads the session with the cookie cache off, so a revoked or banned session
 * stops working at once instead of after the 5-minute cache. Wrapped in
 * React's cache() so the layout and page (both of which call requireAuth per
 * request) share one auth.api.getSession call instead of two.
 */
export const getCurrentSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
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

  // Take the role from the fresh row we just read (cheap, and keeps it correct
  // even if the session's own user snapshot is older).
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

/**
 * Admin gate for API routes: returns the session, or a 401/403 NextResponse to
 * return as is. Reads the session with the cookie cache off so a demoted or
 * banned admin loses access at once.
 *
 *   const session = await requireAdminApi()
 *   if (session instanceof NextResponse) return session
 */
export async function requireAdminApi() {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasRole(session.user.role, 'admin')) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  return session
}
