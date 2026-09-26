import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth-helpers"
import { config } from "@/config/env"
import { getSystemSettings, updateSystemSettings } from "@/lib/settings-queries"
import { logActivity } from "@/lib/activity-logger"
import { z } from "zod"

const patchSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().max(2000).nullable().optional(),
  maintenanceExemptPaths: z
    .array(z.string().max(200).regex(/^\/\S*$/, "Paths must start with / and contain no spaces"))
    .max(100)
    .optional(),
  authEnableGoogle: z.boolean().optional(),
  authEnableEmailPassword: z.boolean().optional(),
  authEnableOneTap: z.boolean().optional(),
  enableSessionRevocation: z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
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
    const parsed = patchSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings" }, { status: 400 })
    }

    const patch = parsed.data
    const current = await getSystemSettings()

    // Mirror createAuth()'s own guard in server/auth.ts — never let an admin
    // save a config that leaves literally no way for anyone to sign in.
    const nextGoogle = patch.authEnableGoogle ?? current.authEnableGoogle
    const nextEmailPassword = patch.authEnableEmailPassword ?? current.authEnableEmailPassword
    const anyMethodLeft =
      (config.AUTH_ENABLE_GOOGLE && nextGoogle) ||
      (config.AUTH_ENABLE_EMAIL_PASSWORD && nextEmailPassword)

    if (!anyMethodLeft) {
      return NextResponse.json(
        { error: "At least one sign-in method must remain enabled" },
        { status: 400 }
      )
    }

    const updated = await updateSystemSettings(patch, session.user.id)

    const changedFields = Object.keys(patch)
    await logActivity({
      userId: session.user.id,
      action: 'settings_changed',
      description: `Admin updated system settings: ${changedFields.join(', ') || 'no fields'}`,
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      metadata: { changed: patch },
    })

    return NextResponse.json({ success: true, settings: updated })
  } catch (error) {
    console.error('Error updating system settings:', error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}
