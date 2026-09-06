import "server-only"
import { db } from "../server/db"
import { activityLogs } from "../server/db/schema"

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_changed'
  | 'email_changed'
  | 'profile_updated'
  | 'session_revoked'
  | 'user_deleted'
  | 'user_banned'
  | 'user_unbanned'
  | 'role_changed'
  | 'impersonation_started'
  | 'impersonation_stopped'
  | 'settings_changed'
  | 'passkey_added'
  | 'passkey_removed'

interface LogActivityParams {
  userId: string
  action: ActivityAction
  description: string
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, any>
  // Populated on 'login' events only — see server/auth.ts's session.create hook.
  referrerUrl?: string | null
  os?: string | null
  browser?: string | null
  deviceType?: string | null
  country?: string | null
  city?: string | null
}

export async function logActivity({
  userId,
  action,
  description,
  ipAddress,
  userAgent,
  metadata,
  referrerUrl,
  os,
  browser,
  deviceType,
  country,
  city,
}: LogActivityParams) {
  try {
    await db.insert(activityLogs).values({
      userId,
      action,
      description,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      referrerUrl: referrerUrl || null,
      os: os || null,
      browser: browser || null,
      deviceType: deviceType || null,
      country: country || null,
      city: city || null,
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw - activity logging should not break the app
  }
}
