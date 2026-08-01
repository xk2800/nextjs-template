import "server-only"
import { db } from "../server/db"
import { users, sessions } from "../server/db/schema"
import { sql } from "drizzle-orm"

export async function getAdminStats() {
  const totalUsersResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(users)
  const totalUsers = totalUsersResult[0]?.count || 0

  const now = new Date()
  const activeSessionsResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(sessions)
    .where(sql`${sessions.expiresAt} > ${now}`)
  const activeSessions = activeSessionsResult[0]?.count || 0

  const adminCountResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(users)
    .where(sql`${users.role} = 'admin'`)
  const adminCount = adminCountResult[0]?.count || 0

  return {
    totalUsers,
    activeSessions,
    adminCount,
    regularUsers: totalUsers - adminCount,
  }
}
