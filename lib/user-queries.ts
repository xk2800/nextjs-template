import "server-only"
import { db } from "../server/db"
import { users, activityLogs } from "../server/db/schema"
import { like, desc, or, eq, and, min, sql, getTableColumns, type SQL } from "drizzle-orm"

export async function getUserById(id: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  return result[0] || null
}

// Recipients for security alerts (new-device sign-ins, etc.). Every admin.
export async function getAdminEmails(): Promise<string[]> {
  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.role, "admin"))

  return rows.map((r) => r.email)
}

// Latest unconsumed password-link expiry. Admin invites ride the reset flow, so
// with lastLoginAt null this means "invited, not accepted yet". "user"."id" is
// qualified on purpose: bare ${users.id} would bind to verification.id.
const inviteExpiresAtSql = sql<Date | null>`(select max(v."expiresAt") from "verification" v where v."value" = "user"."id" and v."identifier" like 'reset-password:%')`
  .mapWith((v) => (v == null ? null : new Date(v)))

export async function getUserInviteExpiry(id: string) {
  const [row] = await db.select({ at: inviteExpiresAtSql }).from(users).where(eq(users.id, id)).limit(1)
  return row?.at ?? null
}

// When the admin invited this user and when they first signed in (= accepted).
// The invite is read back from the activity log row the invite route writes
// (metadata.invited); acceptance is the user's first 'login' event.
export async function getUserInviteInfo(id: string, email: string) {
  const [[invited], [accepted]] = await Promise.all([
    db
      .select({ at: min(activityLogs.createdAt) })
      .from(activityLogs)
      .where(and(
        eq(activityLogs.action, "role_changed"),
        sql`${activityLogs.metadata}::jsonb ->> 'invited' = 'true'`,
        sql`lower(${activityLogs.metadata}::jsonb ->> 'targetUserEmail') = ${email.toLowerCase()}`,
      )),
    db
      .select({ at: min(activityLogs.createdAt) })
      .from(activityLogs)
      .where(and(eq(activityLogs.userId, id), eq(activityLogs.action, "login"))),
  ])
  return { invitedAt: invited?.at ?? null, acceptedAt: accepted?.at ?? null }
}

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
      .select({
        ...getTableColumns(users),
        inviteExpiresAt: inviteExpiresAtSql,
      })
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
