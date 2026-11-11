import "server-only"
import { and, asc, eq, gt, inArray, isNotNull } from "drizzle-orm"
import { db } from "@/server/db"
import { activityLogs, sessions, users } from "@/server/db/schema"

export type ImpersonationStatus = "active" | "ended" | "revoked"

export interface ImpersonationSession {
  id: string
  status: ImpersonationStatus
  adminId: string
  adminName: string | null
  adminEmail: string | null
  targetId: string | null
  targetName: string | null
  targetEmail: string | null
  startedAt: Date
  /** null while active, or when the session expired without a stop event. */
  endedAt: Date | null
  ipAddress: string | null
  userAgent: string | null
}

// ponytail: pairs the newest 5000 events in memory, then filters/paginates in JS.
// Move to a SQL window query if impersonation history ever outgrows that.
const EVENT_CAP = 5000

export async function getImpersonationSessions({
  search = "",
  status,
  page = 1,
  limit = 10,
}: { search?: string; status?: string; page?: number; limit?: number }) {
  const events = (
    await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        adminId: activityLogs.userId,
        metadata: activityLogs.metadata,
        ipAddress: activityLogs.ipAddress,
        userAgent: activityLogs.userAgent,
        createdAt: activityLogs.createdAt,
      })
      .from(activityLogs)
      .where(inArray(activityLogs.action, ["impersonation_started", "impersonation_stopped"]))
      .orderBy(asc(activityLogs.createdAt))
      .limit(EVENT_CAP)
  ).map((e) => {
    let meta: { impersonatedUserId?: string; forced?: boolean } = {}
    try { meta = e.metadata ? JSON.parse(e.metadata) : {} } catch { /* keep {} */ }
    return { ...e, targetId: meta.impersonatedUserId ?? null, forced: !!meta.forced }
  })

  // Live impersonated sessions are the source of truth for "active".
  const live = await db
    .select({ adminId: sessions.impersonatedBy, targetId: sessions.userId, ipAddress: sessions.ipAddress, userAgent: sessions.userAgent })
    .from(sessions)
    .where(and(isNotNull(sessions.impersonatedBy), gt(sessions.expiresAt, new Date())))
  const liveByKey = new Map(live.map((l) => [`${l.adminId}|${l.targetId}`, l]))

  // Pair each stop with the latest open start for the same admin + target.
  const all: ImpersonationSession[] = []
  const open = new Map<string, ImpersonationSession[]>()
  for (const e of events) {
    const key = `${e.adminId}|${e.targetId}`
    if (e.action === "impersonation_started") {
      const s: ImpersonationSession = {
        id: e.id, status: "ended", adminId: e.adminId, adminName: null, adminEmail: null,
        targetId: e.targetId, targetName: null, targetEmail: null,
        startedAt: e.createdAt, endedAt: null, ipAddress: e.ipAddress, userAgent: e.userAgent,
      }
      all.push(s)
      open.set(key, [...(open.get(key) ?? []), s])
    } else {
      const s = open.get(key)?.pop()
      if (s) {
        s.endedAt = e.createdAt
        s.status = e.forced ? "revoked" : "ended"
      }
    }
  }
  for (const [key, stack] of open) {
    const l = liveByKey.get(key)
    // Only the newest unclosed start can still be live.
    const s = stack[stack.length - 1]
    if (l && s) {
      s.status = "active"
      s.ipAddress ??= l.ipAddress
      s.userAgent ??= l.userAgent
    }
  }

  // Names/emails for every admin + target involved.
  const ids = [...new Set(all.flatMap((s) => [s.adminId, s.targetId].filter((x): x is string => !!x)))]
  const people = ids.length
    ? new Map((await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, ids))).map((u) => [u.id, u]))
    : new Map<string, { id: string; name: string; email: string }>()
  for (const s of all) {
    const a = people.get(s.adminId), t = s.targetId ? people.get(s.targetId) : undefined
    s.adminName = a?.name ?? null; s.adminEmail = a?.email ?? null
    s.targetName = t?.name ?? null; s.targetEmail = t?.email ?? null
  }

  const now = Date.now()
  const stats = {
    active: all.filter((s) => s.status === "active").length,
    last24h: all.filter((s) => now - s.startedAt.getTime() < 86_400_000).length,
    uniqueAdmins: new Set(all.map((s) => s.adminId)).size,
  }

  const q = search.trim().toLowerCase()
  const filtered = all
    .filter((s) => !status || status === "all" || s.status === status)
    .filter((s) => !q || [s.adminEmail, s.adminName, s.targetEmail, s.targetName].some((v) => v?.toLowerCase().includes(q)))
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())

  return {
    sessions: filtered.slice((page - 1) * limit, page * limit),
    total: filtered.length,
    pages: Math.max(1, Math.ceil(filtered.length / limit)),
    stats,
  }
}

/** Kills every live impersonated session of `adminId` as `targetId`. Returns how many were removed. */
export async function endImpersonation(adminId: string, targetId: string) {
  const removed = await db
    .delete(sessions)
    .where(and(eq(sessions.impersonatedBy, adminId), eq(sessions.userId, targetId)))
    .returning({ id: sessions.id })
  return removed.length
}
