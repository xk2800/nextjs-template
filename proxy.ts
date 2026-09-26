import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/server/auth'
import { getSystemSettings } from '@/lib/settings-queries'
import { isMaintenanceExempt } from '@/lib/maintenance'

function getSessionCookie(request: NextRequest) {
  // Check for both the standard and the __Secure- prefixed cookie
  return (
    request.cookies.get('better-auth.session_token') ||
    request.cookies.get('__Secure-better-auth.session_token')
  )
}

// Admins (and admins impersonating a user) bypass maintenance mode so they
// can keep working and reach /dashboard/admin/settings to turn it off.
async function canBypassMaintenance(request: NextRequest) {
  if (!getSessionCookie(request)) return false
  const session = await auth.api.getSession({ headers: request.headers })
  return session?.user.role === 'admin' || !!session?.session.impersonatedBy
}

export async function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl

  // Maintenance mode: everything except the admin-configured exempt paths
  // (plus the always-open auth paths in lib/maintenance.ts). Settings are
  // cached in-process for 10s, so this is usually no DB round trip.
  const settings = await getSystemSettings()
  if (
    settings.maintenanceMode &&
    !isMaintenanceExempt(pathname, settings.maintenanceExemptPaths) &&
    !(await canBypassMaintenance(request))
  ) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Down for maintenance' }, { status: 503 })
    }
    return NextResponse.redirect(new URL('/maintenance', origin))
  }

  // Optimistic dashboard gate — full session validation happens in
  // app/dashboard/layout.tsx.
  if (pathname.startsWith('/dashboard') && !getSessionCookie(request)) {
    const callbackUrl = encodeURIComponent(pathname)
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, origin)
    )
  }

  return NextResponse.next()
}

export const config = {
  // Every route except static assets / files with an extension, so
  // maintenance mode can cover pages and API routes alike.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
