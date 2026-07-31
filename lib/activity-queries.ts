import "server-only"
import { db } from "../server/db"
import { activityLogs, users, ActivityActionEnum } from "../server/db/schema"
import { eq, desc, and, or, like, gte, lte, sql, type SQL } from "drizzle-orm"

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

export type ActivityActionFilter = (typeof ActivityActionEnum.enumValues)[number]

export interface ActivityLogFilters {
  search?: string
  action?: ActivityActionFilter
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
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

  const where = conditions.length > 0 ? and(...conditions) : undefined

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
