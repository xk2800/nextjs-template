import "server-only"
import { db } from "../server/db"
import { users, sessions } from "../server/db/schema"
import { sql, gte, eq } from "drizzle-orm"

// Powers the admin panel's landing page (/dashboard/admin) — kept separate
// from getAdminStats (the compact overview embedded in the main dashboard)
// since the two surfaces show different metrics.
export async function getAdminDashboardStats() {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [totalUsersResult, newSignupsResult, activeSessionsResult, bannedResult] = await Promise.all([
    db.select({ count: sql<number>`cast(count(*) as integer)` }).from(users),
    db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(users)
      .where(gte(users.createdAt, weekAgo)),
    db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(sessions)
      .where(sql`${sessions.expiresAt} > ${now}`),
    db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(users)
      .where(eq(users.banned, true)),
  ])

  return {
    totalUsers: totalUsersResult[0]?.count || 0,
    newSignupsThisWeek: newSignupsResult[0]?.count || 0,
    activeSessions: activeSessionsResult[0]?.count || 0,
    bannedCount: bannedResult[0]?.count || 0,
  }
}

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
