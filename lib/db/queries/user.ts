import "server-only"
import { db } from "../../../server/db"
import { users, activityLogs, accounts, passkeys, RoleEnum } from "../../../server/db/schema"
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

// 2FA flag, passkey count and linked sign-in providers for the admin detail page.
export async function getUserSecurity(id: string, twoFactorEnabled: boolean) {
  const [[pk], providerRows] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(passkeys).where(eq(passkeys.userId, id)),
    db.select({ p: accounts.providerId }).from(accounts).where(eq(accounts.userId, id)),
  ])
  return {
    twoFactorEnabled,
    passkeyCount: Number(pk?.n ?? 0),
    providers: [...new Set(providerRows.map((r) => r.p))],
  }
}

export interface UserFilters {
  search?: string
  role?: string
  status?: string
  page?: number
  limit?: number
}

const hasInviteSql = sql`exists (select 1 from "verification" v where v."value" = "user"."id" and v."identifier" like 'reset-password:%')`
const isInvitedSql = sql`("user"."lastLoginAt" is null and ${hasInviteSql})`

type UsersFilter = { search?: string; role?: string; status?: string }

function buildUsersWhere({ search = "", role, status }: UsersFilter): SQL | undefined {
  const conds: (SQL | undefined)[] = [
    search.trim() ? or(like(users.name, `%${search}%`), like(users.email, `%${search}%`)) : undefined,
    role && (RoleEnum.enumValues as readonly string[]).includes(role) ? eq(users.role, role as (typeof RoleEnum.enumValues)[number]) : undefined,
    status === "banned" ? eq(users.banned, true) : undefined,
    status === "invited" ? and(eq(users.banned, false), isInvitedSql) : undefined,
    status === "active" ? and(eq(users.banned, false), sql`not ${isInvitedSql}`) : undefined,
  ]
  return and(...conds)
}

export async function getUsersFiltered({ search = "", role, status, page = 1, limit = 10 }: UserFilters) {
  const offset = (page - 1) * limit

  const where = buildUsersWhere({ search, role, status })

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
  role?: string
  status?: string
}

// Caps export size to keep the CSV response bounded on very large tables.
const EXPORT_ROW_LIMIT = 10_000

export async function getUsersForExport({ search = "", role, status }: UserExportFilters) {
  const where = buildUsersWhere({ search, role, status })

  return db
    .select()
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(EXPORT_ROW_LIMIT)
}
