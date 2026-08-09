import "server-only"
import { db } from "../server/db"
import { users } from "../server/db/schema"
import { like, desc, or, sql, type SQL } from "drizzle-orm"

export interface UserFilters {
  search?: string
  page?: number
  limit?: number
}

function buildUsersWhere(search: string): SQL | undefined {
  return search.trim()
    ? (or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
      ) as SQL)
    : undefined
}

export async function getUsersFiltered({ search = "", page = 1, limit = 10 }: UserFilters) {
  const offset = (page - 1) * limit

  const where = buildUsersWhere(search)

  const [usersList, countResult] = await Promise.all([
    db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(where),
  ])

  const total = Number(countResult[0]?.count ?? 0)

  return {
    users: usersList,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  }
}

export interface UserExportFilters {
  search?: string
}

// Caps export size to keep the CSV response bounded on very large tables.
const EXPORT_ROW_LIMIT = 10_000

export async function getUsersForExport({ search = "" }: UserExportFilters) {
  const where = buildUsersWhere(search)

  return db
    .select()
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(EXPORT_ROW_LIMIT)
}
