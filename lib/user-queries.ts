import "server-only"
import { db } from "../server/db"
import { users } from "../server/db/schema"
import { like, desc, or, sql, type SQL } from "drizzle-orm"

export interface UserFilters {
  search?: string
  page?: number
  limit?: number
}

export async function getUsersFiltered({ search = "", page = 1, limit = 10 }: UserFilters) {
  const offset = (page - 1) * limit

  const where: SQL | undefined = search.trim()
    ? (or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
      ) as SQL)
    : undefined

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
