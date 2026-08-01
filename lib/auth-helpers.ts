import "server-only"
import { auth } from "../server/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "../server/db"
import { users } from "../server/db/schema"
import { eq } from "drizzle-orm"

/**
 * Get current session (server-side only)
 * Returns session data or null if not authenticated
 */
export async function getCurrentSession() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  return session
}

/**
 * Require authentication - redirect to login if not authenticated
 * Use in server components/layouts that need protection
 */
export async function requireAuth() {
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

  return session
}

/**
 * Check if user has specific role
 */
export function hasRole(userRole: string | null | undefined, requiredRole: 'user' | 'admin'): boolean {
  if (!userRole) return false

  if (requiredRole === 'admin') {
    return userRole === 'admin'
  }

  // 'user' role check - both 'user' and 'admin' have access
  return userRole === 'user' || userRole === 'admin'
}

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

