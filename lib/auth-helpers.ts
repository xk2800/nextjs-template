import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

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
 * Format date consistently across dashboard
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get user initials for avatar fallback
 */
export function getUserInitials(name: string | null | undefined): string {
  if (!name) return 'U'

  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
