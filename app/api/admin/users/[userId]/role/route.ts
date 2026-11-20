import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { requireAdminApi } from "@/lib/auth/helpers"
import { db } from "@/server/db"
import { users, RoleEnum } from "@/server/db/schema"
import { and, eq } from "drizzle-orm"
import { getClientIp } from "@/lib/utils/request-info"
import { otherActiveAdminExists } from "@/lib/auth/last-admin"
import { logActivity } from "@/lib/security/activity-logger"
import { unexpectedErrorMessage } from "@/lib/utils/errors"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session

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

    // Demoting an admin: "another active admin remains" is checked in the same
    // statement as the write (see lib/auth/last-admin.ts), so concurrent
    // demotions can't both pass.
    if (oldRole === 'admin' && role !== 'admin') {
      const updated = await db
        .update(users)
        .set({ role })
        .where(
          and(
            eq(users.id, userId),
            otherActiveAdminExists([userId]),
          ),
        )
        .returning({ id: users.id })

      if (updated.length === 0) {
        return NextResponse.json(
          { error: "Cannot remove the last remaining admin" },
          { status: 400 }
        )
      }
    } else {
      await db
        .update(users)
        .set({ role })
        .where(eq(users.id, userId))
    }

    await logActivity({
      userId: session.user.id,
      action: 'role_changed',
      description: `Admin changed role for ${targetUser[0].email} from ${oldRole} to ${role}`,
      ipAddress: getClientIp(request.headers),
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
    return NextResponse.json(
      { error: unexpectedErrorMessage(error, "Failed to update role") },
      { status: 500 }
    )
  }
}
