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

/**
 * Badge variant per activity log action, shared by activity log tables
 */
export const actionBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  login: 'default',
  logout: 'secondary',
  login_failed: 'destructive',
  password_changed: 'default',
  email_changed: 'default',
  profile_updated: 'secondary',
  session_revoked: 'destructive',
  user_deleted: 'destructive',
  user_banned: 'destructive',
  user_unbanned: 'default',
  role_changed: 'default',
  settings_changed: 'default',
}
