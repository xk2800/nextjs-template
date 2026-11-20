import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/auth/helpers"
import { db } from "@/server/db"
import { users, sessions } from "@/server/db/schema"
import { and, eq } from "drizzle-orm"
import { getClientIp } from "@/lib/utils/request-info"
import { otherActiveAdminExists } from "@/lib/auth/last-admin"
import { logActivity } from "@/lib/security/activity-logger"
import { unexpectedErrorMessage } from "@/lib/utils/errors"
import { sendBanEmail } from "@/lib/email/ban-email"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session

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
      // Ban the user. Banning an active admin needs another active admin to
      // remain, checked in the same statement (lib/auth/last-admin.ts).
      const bansAdmin = targetUser[0].role === 'admin' && !targetUser[0].banned
      const banned = await db
        .update(users)
        .set({
          banned: true,
          bannedAt: new Date(),
          bannedReason: reason || null,
          bannedBy: session.user.email,
        })
        .where(and(eq(users.id, userId), eq(users.banned, false), bansAdmin ? otherActiveAdminExists([userId]) : undefined))
        .returning({ id: users.id })

      // Already banned: keep the original ban history and don't re-email.
      if (banned.length === 0 && targetUser[0].banned) {
        return NextResponse.json({ success: true })
      }
      if (banned.length === 0) {
        return NextResponse.json({ error: "Cannot ban the last active admin" }, { status: 400 })
      }

      // Revoke all sessions
      await db.delete(sessions).where(eq(sessions.userId, userId))

      await sendBanEmail(targetUser[0], reason || null)

      // Log the activity
      await logActivity({
        userId: session.user.id,
        action: 'user_banned',
        description: `Admin banned user: ${targetUser[0].email}`,
        ipAddress: getClientIp(request.headers),
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
          bannedBy: null,
        })
        .where(eq(users.id, userId))

      // Log the activity
      await logActivity({
        userId: session.user.id,
        action: 'user_unbanned',
        description: `Admin unbanned user: ${targetUser[0].email}`,
        ipAddress: getClientIp(request.headers),
        userAgent: request.headers.get('user-agent'),
        metadata: {
          unbannedUserId: userId,
          unbannedUserEmail: targetUser[0].email,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: unexpectedErrorMessage(error, "Failed to update ban status") },
      { status: 500 }
    )
  }
}
