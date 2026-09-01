import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/server/auth"
import { db } from "@/server/db"
import { deviceFingerprints } from "@/server/db/schema"
import { config } from "@/config/env"
import { getResend, EMAIL_FROM } from "@/lib/resend"
import {
  getClientIp,
  parseUserAgent,
  lookupGeoLocation,
  formatDeviceInfo,
  formatLocation,
} from "@/lib/request-info"
import { EmailTemplateNewDevice } from "@/components/email/email-template-new-device"

// Called by components/auth/deviceCheck.tsx once per browser session with the
// FingerprintJS visitorId. First time this (user, visitorId) pair is seen ⇒
// email the user that their account signed in from an unrecognized device.
export async function POST(request: Request) {
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { visitorId } = await request.json().catch(() => ({}))
  if (typeof visitorId !== "string" || !visitorId) {
    return NextResponse.json({ error: "visitorId is required" }, { status: 400 })
  }

  // The (userId, visitorId) unique index turns "seen this device before?"
  // into a single write: a returned row means the insert happened (new
  // device), an empty result means the pair already existed. No
  // read-then-write race.
  const [row] = await db
    .insert(deviceFingerprints)
    .values({ userId: session.user.id, visitorId })
    .onConflictDoNothing()
    .returning({ id: deviceFingerprints.id })

  if (!row) {
    return NextResponse.json({ ok: true, newDevice: false })
  }

  // Self-disables when email isn't configured — the fingerprint is still
  // recorded, so once RESEND_API_KEY is set the user isn't retro-alerted for
  // devices seen while it was off.
  if (config.RESEND_API_KEY) {
    const ip = getClientIp(hdrs)
    try {
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: [session.user.email],
        subject: "New sign-in from an unrecognized device",
        react: EmailTemplateNewDevice({
          firstName: session.user.name || "there",
          // IP / UA / geo are for the message body only — the new-vs-known
          // decision above is fingerprint-only.
          device: formatDeviceInfo(parseUserAgent(hdrs.get("user-agent"))),
          location: formatLocation(lookupGeoLocation(ip)),
          ipAddress: ip || "Unknown",
          when: new Date().toUTCString(),
        }),
      })
    } catch (error) {
      console.error("Failed to send new-device email", error)
      // Roll the row back so the next sign-in from this device retries the
      // alert instead of the record silently swallowing it forever.
      await db
        .delete(deviceFingerprints)
        .where(
          and(
            eq(deviceFingerprints.userId, session.user.id),
            eq(deviceFingerprints.visitorId, visitorId),
          ),
        )
      return NextResponse.json({ ok: false, error: "email_failed" }, { status: 502 })
    }
  }

  return NextResponse.json({ ok: true, newDevice: true })
}
