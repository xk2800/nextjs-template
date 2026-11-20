import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { requireAdminApi } from "@/lib/auth/helpers"
import { db } from "@/server/db"
import { sessions } from "@/server/db/schema"
import { eq, desc } from "drizzle-orm"
import { getClientIp } from "@/lib/utils/request-info"
import { logActivity } from "@/lib/security/activity-logger"
import { unexpectedErrorMessage } from "@/lib/utils/errors"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session

  try {
    const { userId } = await params

    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.createdAt))

    return NextResponse.json({ sessions: userSessions })
  } catch (error) {
    return NextResponse.json(
      { error: unexpectedErrorMessage(error, "Failed to fetch user sessions") },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session

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
        ipAddress: getClientIp(request.headers),
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
        ipAddress: getClientIp(request.headers),
        userAgent: request.headers.get('user-agent'),
        metadata: { targetUserId: userId, allSessions: true },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: unexpectedErrorMessage(error, "Failed to revoke sessions") },
      { status: 500 }
    )
  }
}
