import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth-helpers"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import { logActivity } from "@/lib/activity-logger"

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

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
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

    // Delete the user (cascading delete will handle sessions and accounts)
    await db.delete(users).where(eq(users.id, userId))

    // Log the activity
    await logActivity({
      userId: session.user.id,
      action: 'user_deleted',
      description: `Admin deleted user: ${targetUser[0].email}`,
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      metadata: { deletedUserId: userId, deletedUserEmail: targetUser[0].email },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
