import { db } from "@/server/db"
import { sessions } from "@/server/db/schema"
import { eq, desc } from "drizzle-orm"

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string) {
  return await db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.createdAt))
}

/**
 * Get current session info by token
 */
export async function getSessionByToken(token: string) {
  const result = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1)

  return result[0] || null
}

/**
 * Count active sessions for user
 */
export async function countUserSessions(userId: string): Promise<number> {
  const userSessions = await getUserSessions(userId)

  // Filter out expired sessions
  const now = new Date()
  return userSessions.filter(s => s.expiresAt > now).length
}
