import "server-only"
import { db } from "../server/db"
import { users, sessions, authThrottle } from "../server/db/schema"
import { sql, gte, eq, desc } from "drizzle-orm"
import { parseUserAgent, lookupGeoLocation } from "./request-info"
import { WINDOW_MS, isOverLimit } from "./auth-throttle-limits"

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

// Rows below this are noise — a single new signup, or one login typo that
// then succeeded (a success deletes the row, so a lingering count of 1 is
// almost always a lone signup).
const SUSPICIOUS_ATTEMPTS = 2

export type DeviceThrottleRow = Awaited<ReturnType<typeof getDeviceThrottleActivity>>[number]

// Powers the admin "Device throttle" card. One row per device fingerprint
// that's currently accumulating failed sign-ins / sign-ups, newest first,
// with everything an admin needs to block it at the edge (IP) or in-app
// (fingerprint) — parsed device + geo included for context.
export async function getDeviceThrottleActivity(limit = 50) {
  const rows = await db
    .select()
    .from(authThrottle)
    .where(gte(authThrottle.count, SUSPICIOUS_ATTEMPTS))
    .orderBy(desc(authThrottle.lastAttemptAt))
    .limit(limit)

  const now = Date.now()
  return rows.map((r) => {
    const device = parseUserAgent(r.userAgent)
    const geo = lookupGeoLocation(r.ipAddress)
    return {
      fingerprint: r.fingerprint,
      count: r.count,
      windowStart: r.windowStart,
      lastAttemptAt: r.lastAttemptAt,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      lastEmail: r.lastEmail,
      lastKind: r.lastKind,
      os: device.os,
      browser: device.browser,
      deviceType: device.deviceType,
      country: geo.country,
      city: geo.city,
      // Would this device be 429'd on its next attempt right now?
      blocked: isOverLimit(r, now),
      // Is the counter still inside its window (attack ongoing) or has it
      // gone quiet (last burst, awaiting reset on next attempt)?
      windowActive: now - r.windowStart.getTime() < WINDOW_MS,
    }
  })
}
