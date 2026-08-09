import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth-helpers"
import { db } from "@/server/db"
import { users, RoleEnum } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import { logActivity } from "@/lib/activity-logger"

export async function PATCH(
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
    const { role } = body

    if (!RoleEnum.enumValues.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    // Prevent self-role-change (avoids self-lockout)
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      )
    }

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

    const oldRole = targetUser[0].role

    if (oldRole === role) {
      return NextResponse.json(
        { error: `User is already ${role}` },
        { status: 400 }
      )
    }

    // Prevent demoting the last remaining admin
    if (oldRole === 'admin' && role === 'user') {
      const admins = await db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'))

      if (admins.length <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last remaining admin" },
          { status: 400 }
        )
      }
    }

    await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))

    await logActivity({
      userId: session.user.id,
      action: 'role_changed',
      description: `Admin changed role for ${targetUser[0].email} from ${oldRole} to ${role}`,
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      metadata: {
        targetUserId: userId,
        targetUserEmail: targetUser[0].email,
        oldRole,
        newRole: role,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error changing user role:', error)
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    )
  }
}
