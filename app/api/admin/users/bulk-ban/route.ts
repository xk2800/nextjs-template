import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth-helpers"
import { db } from "@/server/db"
import { users, sessions } from "@/server/db/schema"
import { eq, inArray } from "drizzle-orm"
import { logActivity } from "@/lib/activity-logger"

export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const { userIds, ban, reason } = body

    if (!Array.isArray(userIds) || userIds.length === 0 || !userIds.every((id) => typeof id === 'string')) {
      return NextResponse.json(
        { error: "userIds must be a non-empty array of strings" },
        { status: 400 }
      )
    }

    if (typeof ban !== 'boolean') {
      return NextResponse.json(
        { error: "ban parameter is required and must be boolean" },
        { status: 400 }
      )
    }

    // Prevent self-banning
    if (userIds.includes(session.user.id)) {
      return NextResponse.json(
        { error: "You cannot include your own account in a bulk action" },
        { status: 400 }
      )
    }

    const targetUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, userIds))

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: "No matching users found" },
        { status: 404 }
      )
    }

    if (ban) {
      // Prevent banning every remaining admin
      const allAdmins = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, 'admin'))

      const targetAdminCount = targetUsers.filter((u) => u.role === 'admin').length
      if (targetAdminCount > 0 && targetAdminCount >= allAdmins.length) {
        return NextResponse.json(
          { error: "Cannot ban all admin accounts" },
          { status: 400 }
        )
      }

      await db
        .update(users)
        .set({
          banned: true,
          bannedAt: new Date(),
          bannedReason: reason || null,
        })
        .where(inArray(users.id, userIds))

      // Revoke all sessions for the banned users
      await db.delete(sessions).where(inArray(sessions.userId, userIds))

      await logActivity({
        userId: session.user.id,
        action: 'user_banned',
        description: `Admin bulk-banned ${targetUsers.length} user(s)`,
        ipAddress: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
        metadata: {
          bulk: true,
          count: targetUsers.length,
          userIds: targetUsers.map((u) => u.id),
          emails: targetUsers.map((u) => u.email),
          reason: reason || null,
        },
      })
    } else {
      await db
        .update(users)
        .set({
          banned: false,
          bannedAt: null,
          bannedReason: null,
        })
        .where(inArray(users.id, userIds))

      await logActivity({
        userId: session.user.id,
        action: 'user_unbanned',
        description: `Admin bulk-unbanned ${targetUsers.length} user(s)`,
        ipAddress: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
        metadata: {
          bulk: true,
          count: targetUsers.length,
          userIds: targetUsers.map((u) => u.id),
          emails: targetUsers.map((u) => u.email),
        },
      })
    }

    return NextResponse.json({ success: true, count: targetUsers.length })
  } catch (error) {
    console.error('Error bulk banning/unbanning users:', error)
    return NextResponse.json(
      { error: "Failed to update ban status" },
      { status: 500 }
    )
  }
}
