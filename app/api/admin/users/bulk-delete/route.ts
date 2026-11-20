import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/auth/helpers"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { and, inArray } from "drizzle-orm"
import { getClientIp } from "@/lib/utils/request-info"
import { otherActiveAdminExists } from "@/lib/auth/last-admin"
import { logActivity } from "@/lib/security/activity-logger"
import { unexpectedErrorMessage } from "@/lib/utils/errors"

export async function DELETE(request: NextRequest) {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session

  try {
    const body = await request.json()
    const { userIds } = body

    if (!Array.isArray(userIds) || userIds.length === 0 || userIds.length > 100 || !userIds.every((id) => typeof id === 'string')) {
      return NextResponse.json(
        { error: "userIds must be an array of 1-100 strings" },
        { status: 400 }
      )
    }

    // Prevent self-deletion
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

    // Deleting admins: the "another active admin remains" check is part of the
    // write (lib/auth/last-admin.ts). Cascading delete handles sessions and accounts.
    const deletesAdmin = targetUsers.some((u) => u.role === 'admin' && !u.banned)
    const deleted = await db
      .delete(users)
      .where(and(inArray(users.id, userIds), deletesAdmin ? otherActiveAdminExists(userIds) : undefined))
      .returning({ id: users.id })

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Cannot delete all admin accounts" },
        { status: 400 }
      )
    }

    await logActivity({
      userId: session.user.id,
      action: 'user_deleted',
      description: `Admin bulk-deleted ${targetUsers.length} user(s)`,
      ipAddress: getClientIp(request.headers),
      userAgent: request.headers.get('user-agent'),
      metadata: {
        bulk: true,
        count: targetUsers.length,
        userIds: targetUsers.map((u) => u.id),
        emails: targetUsers.map((u) => u.email),
      },
    })

    return NextResponse.json({ success: true, count: targetUsers.length })
  } catch (error) {
    return NextResponse.json(
      { error: unexpectedErrorMessage(error, "Failed to delete users") },
      { status: 500 }
    )
  }
}
