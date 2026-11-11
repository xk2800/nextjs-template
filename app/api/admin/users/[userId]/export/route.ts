import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth/helpers"
import { getUserById, getUserSecurity } from "@/lib/db/queries/user"
import { getUserActivityLogs, getUserLoginHistory } from "@/lib/db/queries/activity"
import { getUserConsentLog, getUserDevices } from "@/lib/db/queries/admin"
import { parseUserAgent, lookupGeoLocation, formatDeviceInfo, formatLocation, type DeviceType } from "@/lib/utils/request-info"
import { toCsv } from "@/lib/utils/csv"
import { unexpectedErrorMessage } from "@/lib/utils/errors"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasRole(session.user.role, 'admin')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { userId } = await params
    const user = await getUserById(userId)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : '')

    const referrer = (metadata: string | null) => {
      try { return JSON.parse(metadata ?? '').referrerUrl ?? '' } catch { return '' }
    }

    type Rows = (string | number | null | undefined)[][]
    // key, title, header, lazy rows (only the selected sections hit the DB).
    const sections: [string, string, string[], () => Promise<Rows>][] = [
      ['profile', 'Profile', ['ID', 'Name', 'Email', 'Email Verified', 'Role', 'Status', 'Banned Reason', 'Last Login', 'Last Active', 'Joined', 'Updated'], async () => [[
        user.id, user.name, user.email, user.emailVerified ? 'Yes' : 'No', user.role,
        user.banned ? 'Banned' : 'Active', user.bannedReason,
        iso(user.lastLoginAt), iso(user.lastActiveAt), iso(user.createdAt), iso(user.updatedAt),
      ]]],
      ['security', 'Security', ['Two-Factor', 'Passkeys', 'Sign-in Methods'], async () => {
        const s = await getUserSecurity(user.id, user.twoFactorEnabled)
        return [[s.twoFactorEnabled ? 'Enabled' : 'Not enabled', s.passkeyCount, s.providers.join('; ')]]
      }],
      ['logins', 'Registration & Login Info', ['Date', 'Device', 'Location', 'IP', 'Referrer'], async () =>
        (await getUserLoginHistory(user.id, 1000)).map((l) => [
          iso(l.createdAt),
          formatDeviceInfo({ os: l.os, browser: l.browser, deviceType: (l.deviceType as DeviceType) || 'desktop' }),
          formatLocation({ country: l.country, city: l.city }),
          l.ipAddress, l.referrerUrl,
        ])],
      ['devices', 'Devices', ['First Seen', 'Device', 'Location', 'IP', 'Visitor ID', 'Signals (JSON)'], async () =>
        (await getUserDevices(user.id)).map((d) => [
          iso(d.createdAt), d.device, formatLocation({ country: d.country, city: d.city }), d.ipAddress, d.visitorId,
          d.components ? JSON.stringify(d.components) : '',
        ])],
      ['consent', 'Consent', ['Date', 'Choice', 'Version'], async () =>
        (await getUserConsentLog(user.id)).map((c) => [iso(c.createdAt), c.choice, c.version])],
      ['activity', 'Activity Log', ['Date', 'Action', 'Description', 'Device', 'Location', 'IP', 'Referrer'], async () =>
        (await getUserActivityLogs(user.id, 1000)).map((l) => [
          iso(l.createdAt), l.action, l.description,
          formatDeviceInfo(parseUserAgent(l.userAgent)), formatLocation(lookupGeoLocation(l.ipAddress)),
          l.ipAddress, referrer(l.metadata),
        ])],
    ]

    // ?sections=profile,security,... ; absent = everything.
    const param = request.nextUrl.searchParams.get('sections')
    const wanted = param === null ? null : new Set(param.split(','))
    const picked = sections.filter(([key]) => !wanted || wanted.has(key))
    if (picked.length === 0) return NextResponse.json({ error: "No sections selected" }, { status: 400 })

    const blocks = await Promise.all(
      picked.map(async ([, title, head, rows]) => toCsv([title], []) + '\r\n' + toCsv(head, await rows()).replace(/^\uFEFF/, ''))
    )
    // toCsv prefixes a BOM; keep only the first.
    const csv = blocks.map((b, i) => (i ? b.replace(/^\uFEFF/, '') : b)).join('\r\n\r\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="user-${user.id}.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: unexpectedErrorMessage(error, "Failed to export user") },
      { status: 500 }
    )
  }
}
