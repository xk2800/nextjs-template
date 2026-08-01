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

interface LogActivityParams {
  userId: string
  action: ActivityAction
  description: string
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, any>
}

export async function logActivity({
  userId,
  action,
  description,
  ipAddress,
  userAgent,
  metadata,
}: LogActivityParams) {
  try {
    await db.insert(activityLogs).values({
      userId,
      action,
      description,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw - activity logging should not break the app
  }
}
