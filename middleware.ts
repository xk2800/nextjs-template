import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl

  if (pathname.startsWith('/dashboard')) {
    // Check for both the standard and the __Secure- prefixed cookie
    const sessionToken =
      request.cookies.get('better-auth.session_token') ||
      request.cookies.get('__Secure-better-auth.session_token')

    if (!sessionToken) {
      const callbackUrl = encodeURIComponent(pathname)
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${callbackUrl}`, origin)
      )
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*', // Protect all dashboard routes
  ],
}
