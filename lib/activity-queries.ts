import "server-only"
import { db } from "../server/db"
import { activityLogs, users, ActivityActionEnum } from "../server/db/schema"
import { eq, desc, and, or, like, gte, lte, sql, inArray, type SQL } from "drizzle-orm"

export async function getUserActivityLogs(userId: string, limit = 50) {
  return await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
}

export async function getAllActivityLogs(limit = 100, offset = 0) {
  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      description: activityLogs.description,
      ipAddress: activityLogs.ipAddress,
      userAgent: activityLogs.userAgent,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
      userId: activityLogs.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .offset(offset)
}

// Narrow, purpose-built feed for the admin panel's "Impersonation log" card —
// so admins have a dedicated view of who's been logging in as whom without
// having to remember to apply the generic action filter first.
export async function getRecentImpersonationEvents(limit = 10) {
  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      description: activityLogs.description,
      createdAt: activityLogs.createdAt,
      adminId: activityLogs.userId,
      adminName: users.name,
      adminEmail: users.email,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(inArray(activityLogs.action, ['impersonation_started', 'impersonation_stopped']))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
}

export type ActivityActionFilter = (typeof ActivityActionEnum.enumValues)[number]

export interface ActivityLogFilters {
  search?: string
  action?: ActivityActionFilter
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}

function buildActivityLogsWhere({
  search = "",
  action,
  dateFrom,
  dateTo,
}: Pick<ActivityLogFilters, "search" | "action" | "dateFrom" | "dateTo">): SQL | undefined {
  const conditions: SQL[] = []
  if (search.trim()) {
    conditions.push(
      or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
      ) as SQL
    )
  }
  if (action) {
    conditions.push(eq(activityLogs.action, action))
  }
  if (dateFrom) {
    conditions.push(gte(activityLogs.createdAt, dateFrom))
  }
  if (dateTo) {
    conditions.push(lte(activityLogs.createdAt, dateTo))
  }

  return conditions.length > 0 ? and(...conditions) : undefined
}

export async function getActivityLogsFiltered({
  search = "",
  action,
  dateFrom,
  dateTo,
  page = 1,
  limit = 20,
}: ActivityLogFilters) {
  const offset = (page - 1) * limit

  const where = buildActivityLogsWhere({ search, action, dateFrom, dateTo })

  const [logs, countResult] = await Promise.all([
    db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        description: activityLogs.description,
        ipAddress: activityLogs.ipAddress,
        userAgent: activityLogs.userAgent,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt,
        userId: activityLogs.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(where)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(where),
  ])

  const total = Number(countResult[0]?.count ?? 0)

  return {
    logs,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  }
}

export type ActivityLogExportFilters = Pick<ActivityLogFilters, "search" | "action" | "dateFrom" | "dateTo">

// Caps export size to keep the CSV response bounded on very large tables.
const EXPORT_ROW_LIMIT = 10_000

export async function getActivityLogsForExport({
  search = "",
  action,
  dateFrom,
  dateTo,
}: ActivityLogExportFilters) {
  const where = buildActivityLogsWhere({ search, action, dateFrom, dateTo })

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      description: activityLogs.description,
      ipAddress: activityLogs.ipAddress,
      userAgent: activityLogs.userAgent,
      metadata: activityLogs.metadata,
      createdAt: activityLogs.createdAt,
      userId: activityLogs.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(where)
    .orderBy(desc(activityLogs.createdAt))
    .limit(EXPORT_ROW_LIMIT)
}
