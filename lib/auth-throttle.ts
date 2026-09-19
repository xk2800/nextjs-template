import "server-only"
import { eq, sql } from "drizzle-orm"
import { db } from "../server/db"
import { authThrottle } from "../server/db/schema"
import { WINDOW_MS, isOverLimit } from "./auth-throttle-limits"

// Is this key (device fingerprint, or "ip:<address>" backstop) currently over
// the cap? Read-only — the caller (server/auth.ts before-hook) decides
// whether to 429.
export async function isDeviceThrottled(fingerprint: string, max?: number): Promise<boolean> {
  try {
    const [row] = await db
      .select({ count: authThrottle.count, windowStart: authThrottle.windowStart })
      .from(authThrottle)
      .where(eq(authThrottle.fingerprint, fingerprint))
      .limit(1)
    return isOverLimit(row, Date.now(), max)
  } catch (error) {
    // Fail open — a throttle-store hiccup must never lock everyone out of sign-in.
    console.error("auth-throttle read failed, allowing request", error)
    return false
  }
}

export type AttemptMeta = {
  ipAddress: string | null
  userAgent: string | null
  email: string | null
  kind: "signin" | "signup"
}

// Atomic upsert: new row at 1, +1 within the live window, or reset to 1 when
// the previous window has elapsed. One statement, so a device hammering the
// endpoint (the whole point) can't race its own counter. The meta fields are
// overwritten every time — they're "last seen from this device", for the
// admin panel's block-list view (lib/admin-queries.ts).
export async function recordDeviceAttempt(fingerprint: string, meta: AttemptMeta): Promise<void> {
  const now = new Date()
  const cutoff = new Date(now.getTime() - WINDOW_MS)
  const seen = {
    lastAttemptAt: now,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    lastEmail: meta.email,
    lastKind: meta.kind,
  }
  try {
    await db
      .insert(authThrottle)
      .values({ fingerprint, count: 1, windowStart: now, ...seen })
      .onConflictDoUpdate({
        target: authThrottle.fingerprint,
        set: {
          count: sql`case when ${authThrottle.windowStart} < ${cutoff} then 1 else ${authThrottle.count} + 1 end`,
          windowStart: sql`case when ${authThrottle.windowStart} < ${cutoff} then ${now} else ${authThrottle.windowStart} end`,
          ...seen,
        },
      })
  } catch (error) {
    console.error("auth-throttle write failed", error)
  }
}

export async function clearDeviceThrottle(fingerprint: string): Promise<void> {
  try {
    await db.delete(authThrottle).where(eq(authThrottle.fingerprint, fingerprint))
  } catch (error) {
    console.error("auth-throttle clear failed", error)
  }
}
