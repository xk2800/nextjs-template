import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { randomBytes } from "node:crypto"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { auth } from "@/server/auth"
import { requireAdminApi } from "@/lib/auth/helpers"
import { db } from "@/server/db"
import { users, RoleEnum } from "@/server/db/schema"
import { getResend, EMAIL_FROM } from "@/lib/email/resend"
import { EmailTemplateInvite } from "@/components/email/team/workspace-invite"
import { getClientIp } from "@/lib/utils/request-info"
import { logActivity } from "@/lib/security/activity-logger"
import { unexpectedErrorMessage } from "@/lib/utils/errors"

const INVITE_TTL_MS = 7 * 24 * 3600 * 1000

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  name: z.string().trim().max(100).optional(),
  role: z.enum(RoleEnum.enumValues),
})

// emailVerified: true because better-auth only links a first-time OAuth login to an
// existing email/password user when that user is verified (the provider must still
// return the same verified email, so only the real owner can claim the account).
// Invite = create the account with a throwaway password, then email a
// set-password link (the reset flow). The link lasts 7 days; after that the
// invitee can use "Forgot password".
export async function POST(request: NextRequest) {
  const reqHeaders = await headers()
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Valid email and role required" }, { status: 400 })
  const { email, name, role } = parsed.data

  let createdUserId: string | null = null
  try {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (existing) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })

    const { user } = await auth.api.createUser({
      headers: reqHeaders,
      body: { email, name: name || email.split("@")[0], password: randomBytes(24).toString("hex"), role: role as "user" | "admin", data: { emailVerified: true } }, // plugin types omit "tester"; runtime accepts any role
    })
    createdUserId = user.id
    // Same token the reset flow uses, minted here so the email can be the invite one.
    const token = randomBytes(18).toString("base64url")
    const { baseURL, internalAdapter } = await auth.$context
    await internalAdapter.createVerificationValue({
      value: user.id,
      identifier: `reset-password:${token}`,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    })
    const url = `${baseURL}/reset-password/${token}?callbackURL=${encodeURIComponent("/reset-password?invite=1")}`
    // Resend returns API failures as { error } instead of throwing.
    const { error: sendError } = await (await getResend()).emails.send({
      from: EMAIL_FROM,
      to: [email],
      subject: "You've been invited",
      react: EmailTemplateInvite({ firstName: user.name || "there", url }),
    })
    if (sendError) throw new Error(sendError.message)

    await logActivity({
      userId: session.user.id,
      action: "role_changed",
      description: `Admin invited ${email} as ${role}`,
      ipAddress: getClientIp(request.headers),
      userAgent: request.headers.get("user-agent"),
      metadata: { targetUserEmail: email, newRole: role, invited: true },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    // Don't leave an account nobody can use (random password, invite never
    // delivered); deleting it lets the admin simply retry.
    if (createdUserId) await db.delete(users).where(eq(users.id, createdUserId)).catch(() => {})
    return NextResponse.json({ error: unexpectedErrorMessage(error, "Failed to invite user") }, { status: 500 })
  }
}
