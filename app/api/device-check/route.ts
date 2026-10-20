import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { cookies, headers } from "next/headers"
import { auth } from "@/server/auth"
import { db } from "@/server/db"
import { deviceFingerprints } from "@/server/db/schema"
import { config } from "@/config/env"
import { getResend, EMAIL_FROM } from "@/lib/resend"
import { getAdminEmails } from "@/lib/user-queries"
import {
  getClientIp,
  parseUserAgent,
  lookupGeoLocation,
  formatDeviceInfo,
  formatLocation,
} from "@/lib/request-info"
import { EmailTemplateNewDevice } from "@/components/email/email-template-new-device"
import { getSystemSettings, isConsentRequired } from "@/lib/settings-queries"
import { COOKIE_CONSENT_COOKIE, EXCLUDED_SIGNALS } from "@/lib/cookie-names"

// Client-sent signals: a plain object under 32 KB (the client hashes large
// values, so real payloads are a few KB), minus the accessibility signals.
// Anything else is dropped rather than failing the device check.
function sanitizeSignals(components: unknown): Record<string, unknown> | null {
  if (!components || typeof components !== "object" || Array.isArray(components)) return null
  if (JSON.stringify(components).length > 32_000) return null
  return Object.fromEntries(Object.entries(components).filter(([name]) => !EXCLUDED_SIGNALS.has(name)))
}

// Called by components/auth/deviceCheck.tsx once per browser session with the
// FingerprintJS visitorId. First time this (user, visitorId) pair is seen ⇒
// email the user AND every admin that the account signed in from an
// unrecognized device, and surface it on the admin panel's "New devices" card.
export async function POST(request: Request) {
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { visitorId, components } = await request.json().catch(() => ({}))
  if (typeof visitorId !== "string" || !visitorId) {
    return NextResponse.json({ error: "visitorId is required" }, { status: 400 })
  }

  // Consent mode: refuse fingerprints from browsers that haven't accepted
  // optional cookies. The client already gates this; this is the server's own
  // check, so a stale or modified client can't record without consent.
  if (isConsentRequired(await getSystemSettings()) && (await cookies()).get(COOKIE_CONSENT_COOKIE)?.value !== "all") {
    return NextResponse.json({ error: "Consent required" }, { status: 403 })
  }

  const signals = sanitizeSignals(components)
  const ip = getClientIp(hdrs)
  const userAgent = hdrs.get("user-agent")
  const device = parseUserAgent(userAgent)
  const geo = lookupGeoLocation(ip)

  // The (userId, visitorId) unique index turns "seen this device before?"
  // into a single write: a returned row means the insert happened (new
  // device), an empty result means the pair already existed. No
  // read-then-write race.
  const [row] = await db
    .insert(deviceFingerprints)
    .values({
      userId: session.user.id,
      visitorId,
      ipAddress: ip,
      userAgent,
      country: geo.country,
      city: geo.city,
      components: signals,
    })
    .onConflictDoNothing()
    .returning({ id: deviceFingerprints.id })

  if (!row) {
    // Known device: refresh its signals (browser updates change some), so the
    // admin page shows the latest snapshot. Rows from before signals were
    // collected get theirs filled in here.
    if (signals) {
      await db
        .update(deviceFingerprints)
        .set({ components: signals })
        .where(
          and(
            eq(deviceFingerprints.userId, session.user.id),
            eq(deviceFingerprints.visitorId, visitorId),
          ),
        )
    }
    return NextResponse.json({ ok: true, newDevice: false })
  }

  // Self-disables when email isn't configured — the fingerprint is still
  // recorded (and shows on the admin panel), so once RESEND_API_KEY is set the
  // user isn't retro-alerted for devices seen while it was off.
  if (config.RESEND_API_KEY) {
    const baseUrl =
      process.env.BETTER_AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      ""
    const deviceLabel = formatDeviceInfo(device)
    const locationLabel = formatLocation(geo)
    const when = new Date().toUTCString()

    try {
      await (await getResend()).emails.send({
        from: EMAIL_FROM,
        to: [session.user.email],
        subject: "New sign-in from an unrecognized device",
        react: EmailTemplateNewDevice({
          firstName: session.user.name || "there",
          device: deviceLabel,
          location: locationLabel,
          ipAddress: ip || "Unknown",
          when,
          manageUrl: `${baseUrl}/dashboard`,
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

    // Best-effort admin fan-out — a failure here does NOT roll back the
    // fingerprint or fail the request; the admin panel's "New devices" card is
    // the durable surface. Sent per-recipient so admins don't see each other.
    // ponytail: emails every admin on every user's every new device. Fine at
    // small scale; for a large user base gate this behind a system_settings
    // flag like the auth toggles.
    try {
      const recipients = (await getAdminEmails()).filter((e) => e !== session.user.email)
      if (recipients.length) {
        const resend = await getResend()
        await Promise.allSettled(
          recipients.map((to) =>
            resend.emails.send({
              from: EMAIL_FROM,
              to: [to],
              subject: `New-device sign-in: ${session.user.email}`,
              react: EmailTemplateNewDevice({
                firstName: "team",
                account: session.user.email,
                device: deviceLabel,
                location: locationLabel,
                ipAddress: ip || "Unknown",
                when,
                manageUrl: `${baseUrl}/dashboard/admin/users/${session.user.id}`,
              }),
            }),
          ),
        )
      }
    } catch (error) {
      console.error("Failed to send admin new-device alert", error)
    }
  }

  return NextResponse.json({ ok: true, newDevice: true })
}

// Consent withdrawn ("Necessary only" on the cookie banner): erase the
// signed-in user's record for this device. Called by deviceCheck.tsx with the
// visitorId it stored while consent was given. Scoped to the session's own
// userId, so a caller can only delete their own rows.
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { visitorId } = await request.json().catch(() => ({}))
  if (typeof visitorId !== "string" || !visitorId) {
    return NextResponse.json({ error: "visitorId is required" }, { status: 400 })
  }

  await db
    .delete(deviceFingerprints)
    .where(
      and(
        eq(deviceFingerprints.userId, session.user.id),
        eq(deviceFingerprints.visitorId, visitorId),
      ),
    )

  return NextResponse.json({ ok: true })
}
