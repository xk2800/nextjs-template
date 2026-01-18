import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth-helpers"
import { db } from "@/server/db"
import { sessions } from "@/server/db/schema"
import { eq, desc } from "drizzle-orm"
import { logActivity } from "@/lib/activity-logger"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasRole(session.user.role, 'admin')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { userId } = await params

    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.createdAt))

    return NextResponse.json({ sessions: userSessions })
  } catch (error) {
    console.error('Error fetching user sessions:', error)
    return NextResponse.json(
      { error: "Failed to fetch user sessions" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasRole(session.user.role, 'admin')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { userId } = await params
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    if (sessionId) {
      // Delete specific session
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

      if (targetSession[0].userId !== userId) {
        return NextResponse.json(
          { error: "Session does not belong to this user" },
          { status: 400 }
        )
      }

      await db.delete(sessions).where(eq(sessions.id, sessionId))

      // Log the activity
      await logActivity({
        userId: session.user.id,
        action: 'session_revoked',
        description: `Admin revoked session for user: ${userId}`,
        ipAddress: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
        metadata: { targetUserId: userId, sessionId },
      })
    } else {
      // Delete all sessions for user
      await db.delete(sessions).where(eq(sessions.userId, userId))

      // Log the activity
      await logActivity({
        userId: session.user.id,
        action: 'session_revoked',
        description: `Admin revoked all sessions for user: ${userId}`,
        ipAddress: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
        metadata: { targetUserId: userId, allSessions: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking user sessions:', error)
    return NextResponse.json(
      { error: "Failed to revoke sessions" },
      { status: 500 }
    )
  }
}
