import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth-helpers"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { eq, inArray } from "drizzle-orm"
import { logActivity } from "@/lib/activity-logger"

export async function DELETE(request: NextRequest) {
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
    const { userIds } = body

    if (!Array.isArray(userIds) || userIds.length === 0 || !userIds.every((id) => typeof id === 'string')) {
      return NextResponse.json(
        { error: "userIds must be a non-empty array of strings" },
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

    // Prevent deleting every remaining admin
    const allAdmins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))

    const targetAdminCount = targetUsers.filter((u) => u.role === 'admin').length
    if (targetAdminCount > 0 && targetAdminCount >= allAdmins.length) {
      return NextResponse.json(
        { error: "Cannot delete all admin accounts" },
        { status: 400 }
      )
    }

    // Delete the users (cascading delete will handle sessions and accounts)
    await db.delete(users).where(inArray(users.id, userIds))

    await logActivity({
      userId: session.user.id,
      action: 'user_deleted',
      description: `Admin bulk-deleted ${targetUsers.length} user(s)`,
      ipAddress: request.headers.get('x-forwarded-for'),
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
    console.error('Error bulk deleting users:', error)
    return NextResponse.json(
      { error: "Failed to delete users" },
      { status: 500 }
    )
  }
}
