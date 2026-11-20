import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/auth/helpers"
import { db } from "@/server/db"
import { users, sessions } from "@/server/db/schema"
import { and, eq, inArray } from "drizzle-orm"
import { getClientIp } from "@/lib/utils/request-info"
import { otherActiveAdminExists } from "@/lib/auth/last-admin"
import { logActivity } from "@/lib/security/activity-logger"
import { sendBanEmail } from "@/lib/email/ban-email"
import { unexpectedErrorMessage } from "@/lib/utils/errors"

export async function POST(request: NextRequest) {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session

  try {
    const body = await request.json()
    const { userIds, ban, reason } = body

    if (!Array.isArray(userIds) || userIds.length === 0 || userIds.length > 100 || !userIds.every((id) => typeof id === 'string')) {
      return NextResponse.json(
        { error: "userIds must be an array of 1-100 strings" },
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
      // Banning admins: the "another active admin remains" check is part of
      // the write (lib/auth/last-admin.ts), so concurrent bans can't both pass.
      const bansAdmin = targetUsers.some((u) => u.role === 'admin' && !u.banned)
      const banned = await db
        .update(users)
        .set({
          banned: true,
          bannedAt: new Date(),
          bannedReason: reason || null,
          bannedBy: session.user.email,
        })
        .where(and(inArray(users.id, userIds), eq(users.banned, false), bansAdmin ? otherActiveAdminExists(userIds) : undefined))
        .returning()

      // Only freshly banned rows below: already-banned users keep their ban
      // history and aren't re-emailed.
      if (banned.length === 0 && targetUsers.every((u) => u.banned)) {
        return NextResponse.json({ success: true, count: 0 })
      }
      if (banned.length === 0) {
        return NextResponse.json(
          { error: "Cannot ban all admin accounts" },
          { status: 400 }
        )
      }

      // Revoke sessions before the slow email fan-out so bans bite at once.
      await db.delete(sessions).where(inArray(sessions.userId, banned.map((u) => u.id)))

      // One at a time: Resend's default limit is ~2 req/s, a parallel burst would mostly fail.
      for (const u of banned) await sendBanEmail(u, reason || null)

      await logActivity({
        userId: session.user.id,
        action: 'user_banned',
        description: `Admin bulk-banned ${banned.length} user(s)`,
        ipAddress: getClientIp(request.headers),
        userAgent: request.headers.get('user-agent'),
        metadata: {
          bulk: true,
          count: banned.length,
          userIds: banned.map((u) => u.id),
          emails: banned.map((u) => u.email),
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
          bannedBy: null,
        })
        .where(inArray(users.id, userIds))

      await logActivity({
        userId: session.user.id,
        action: 'user_unbanned',
        description: `Admin bulk-unbanned ${targetUsers.length} user(s)`,
        ipAddress: getClientIp(request.headers),
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
    return NextResponse.json(
      { error: unexpectedErrorMessage(error, "Failed to update ban status") },
      { status: 500 }
    )
  }
}
