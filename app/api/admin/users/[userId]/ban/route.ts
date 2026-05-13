import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth-helpers"
import { db } from "@/server/db"
import { users, sessions } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import { logActivity } from "@/lib/activity-logger"

export async function POST(
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
    const body = await request.json()
    const { ban, reason } = body

    if (typeof ban !== 'boolean') {
      return NextResponse.json(
        { error: "ban parameter is required and must be boolean" },
        { status: 400 }
      )
    }

    // Prevent self-banning
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot ban/unban your own account" },
        { status: 400 }
      )
    }

    // Verify user exists
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!targetUser[0]) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (ban) {
      // Ban the user
      await db
        .update(users)
        .set({
          banned: true,
          bannedAt: new Date(),
          bannedReason: reason || null,
        })
        .where(eq(users.id, userId))

      // Revoke all sessions
      await db.delete(sessions).where(eq(sessions.userId, userId))

      // Log the activity
      await logActivity({
        userId: session.user.id,
        action: 'user_banned',
        description: `Admin banned user: ${targetUser[0].email}`,
        ipAddress: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
        metadata: {
          bannedUserId: userId,
          bannedUserEmail: targetUser[0].email,
          reason: reason || null,
        },
      })
    } else {
      // Unban the user
      await db
        .update(users)
        .set({
          banned: false,
          bannedAt: null,
          bannedReason: null,
        })
        .where(eq(users.id, userId))

      // Log the activity
      await logActivity({
        userId: session.user.id,
        action: 'user_unbanned',
        description: `Admin unbanned user: ${targetUser[0].email}`,
        ipAddress: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
        metadata: {
          unbannedUserId: userId,
          unbannedUserEmail: targetUser[0].email,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error banning/unbanning user:', error)
    return NextResponse.json(
      { error: "Failed to update ban status" },
      { status: 500 }
    )
  }
}
