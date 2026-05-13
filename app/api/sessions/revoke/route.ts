import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { db } from "@/server/db"
import { sessions } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import { logActivity } from "@/lib/activity-logger"
import { config } from "@/config/env"

export async function POST(request: NextRequest) {
  // Check if session revocation is enabled
  if (!config.ENABLE_SESSION_REVOCATION) {
    return NextResponse.json(
      { error: "Session revocation is disabled" },
      { status: 403 }
    )
  }

  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }

    // Verify the session belongs to the current user
    const targetSession = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1)

    if (!targetSession[0]) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      )
    }

    if (targetSession[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only revoke your own sessions" },
        { status: 403 }
      )
    }

    // Delete the session
    await db.delete(sessions).where(eq(sessions.id, sessionId))

    // Log the activity
    await logActivity({
      userId: session.user.id,
      action: 'session_revoked',
      description: 'User revoked a session',
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      metadata: { sessionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking session:', error)
    return NextResponse.json(
      { error: "Failed to revoke session" },
      { status: 500 }
    )
  }
}
