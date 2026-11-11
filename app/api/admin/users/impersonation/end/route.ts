import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { eq } from "drizzle-orm"
import { auth } from "@/server/auth"
import { hasRole } from "@/lib/auth/helpers"
import { endImpersonation } from "@/lib/db/queries/impersonation"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { logActivity } from "@/lib/security/activity-logger"
import { unexpectedErrorMessage } from "@/lib/utils/errors"

// Force-ends an active impersonation by deleting its session(s). The stop
// event is logged with metadata.forced so the table can show it as Revoked.
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasRole(session.user.role, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { adminId, targetId } = await request.json().catch(() => ({}))
    if (typeof adminId !== "string" || typeof targetId !== "string") {
      return NextResponse.json({ error: "adminId and targetId required" }, { status: 400 })
    }
    const removed = await endImpersonation(adminId, targetId)
    if (!removed) return NextResponse.json({ error: "No active session to end" }, { status: 404 })

    const [target] = await db.select({ email: users.email }).from(users).where(eq(users.id, targetId)).limit(1)
    await logActivity({
      userId: adminId,
      action: "impersonation_stopped",
      description: `${session.user.email} force-ended impersonation of ${target?.email ?? targetId}`,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
      metadata: { impersonatedUserId: targetId, forced: true, endedBy: session.user.id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: unexpectedErrorMessage(error, "Failed to end impersonation") }, { status: 500 })
  }
}
