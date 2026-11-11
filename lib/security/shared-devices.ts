// Pure grouping for the admin "Shared devices" card — no DB, no `server-only`,
// so it stays unit-testable. Consumed by lib/admin-queries.ts.

export type SharedDeviceAccountRow = {
  visitorId: string
  userId: string
  userName: string
  userEmail: string
  banned: boolean
  firstSeenAt: Date
  userAgent: string | null
  country: string | null
  city: string | null
}

export type SharedDevice = {
  visitorId: string
  accountCount: number
  lastSeenAt: Date
  country: string | null
  city: string | null
  userAgent: string | null
  accounts: {
    userId: string
    userName: string
    userEmail: string
    banned: boolean
    firstSeenAt: Date
  }[]
}

// Collapse flat (account, device) rows into one entry per device fingerprint,
// keep only devices reached by `minAccounts`+ accounts (the multi-account /
// trial-abuse signal), most-accounts device first. Device context (UA/geo) is
// taken from whichever row for that visitorId is seen first — pass rows newest
// first if you want the most recent context.
export function groupSharedDevices(
  rows: SharedDeviceAccountRow[],
  minAccounts: number,
  limit: number,
): SharedDevice[] {
  const byVisitor = new Map<string, SharedDevice>()

  for (const r of rows) {
    let d = byVisitor.get(r.visitorId)
    if (!d) {
      d = {
        visitorId: r.visitorId,
        accountCount: 0,
        lastSeenAt: r.firstSeenAt,
        country: r.country,
        city: r.city,
        userAgent: r.userAgent,
        accounts: [],
      }
      byVisitor.set(r.visitorId, d)
    }
    d.accountCount++
    if (r.firstSeenAt > d.lastSeenAt) d.lastSeenAt = r.firstSeenAt
    d.accounts.push({
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      banned: r.banned,
      firstSeenAt: r.firstSeenAt,
    })
  }

  return [...byVisitor.values()]
    .filter((d) => d.accountCount >= minAccounts)
    .sort(
      (a, b) =>
        b.accountCount - a.accountCount || b.lastSeenAt.getTime() - a.lastSeenAt.getTime(),
    )
    .slice(0, limit)
}
