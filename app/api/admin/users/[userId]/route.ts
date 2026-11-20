import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { requireAdminApi } from "@/lib/auth/helpers"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import { getClientIp } from "@/lib/utils/request-info"
import { logActivity } from "@/lib/security/activity-logger"
import { unexpectedErrorMessage } from "@/lib/utils/errors"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session

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
      ipAddress: getClientIp(request.headers),
      userAgent: request.headers.get('user-agent'),
      metadata: { deletedUserId: userId, deletedUserEmail: targetUser[0].email },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: unexpectedErrorMessage(error, "Failed to delete user") },
      { status: 500 }
    )
  }
}
