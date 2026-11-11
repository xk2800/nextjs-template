// Pure mapping (safe for client + server) from an activity action to the
// severity and category the audit log UI shows and filters by. New actions
// default to info / system until classified here.
export type ActivitySeverity = 'info' | 'warning' | 'critical' | 'security'
export type ActivityCategory = 'auth' | 'users' | 'system'

const SEVERITY: Record<string, ActivitySeverity> = {
  login_failed: 'warning',
  session_revoked: 'warning',
  passkey_removed: 'warning',
  user_deleted: 'critical',
  user_banned: 'critical',
  role_changed: 'security',
  impersonation_started: 'security',
  impersonation_stopped: 'security',
  settings_changed: 'security',
}

const CATEGORY: Record<string, ActivityCategory> = {
  login: 'auth',
  logout: 'auth',
  login_failed: 'auth',
  password_changed: 'auth',
  email_changed: 'auth',
  session_revoked: 'auth',
  passkey_added: 'auth',
  passkey_removed: 'auth',
  profile_updated: 'users',
  user_deleted: 'users',
  user_banned: 'users',
  user_unbanned: 'users',
  role_changed: 'users',
  impersonation_started: 'users',
  impersonation_stopped: 'users',
}

export const severityOf = (action: string): ActivitySeverity => SEVERITY[action] ?? 'info'
export const categoryOf = (action: string): ActivityCategory => CATEGORY[action] ?? 'system'

export const SEVERITY_LABELS: Record<ActivitySeverity, string> = {
  info: 'Info', warning: 'Warning', critical: 'Critical', security: 'Security',
}
export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  auth: 'Authentication', users: 'User management', system: 'System',
}

/** All known actions matching the filters, or undefined when neither filter is set. */
export function actionsFor(
  allActions: readonly string[],
  category?: string | null,
  severity?: string | null,
): string[] | undefined {
  if (!category && !severity) return undefined
  return allActions.filter(
    (a) => (!category || categoryOf(a) === category) && (!severity || severityOf(a) === severity),
  )
}
