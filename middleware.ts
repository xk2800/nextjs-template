import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl

  // Check if accessing protected dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // Get session cookie (lightweight check for UX optimization)
    const sessionCookie = request.cookies.get('better-auth.session_token')

    // If no session cookie exists, redirect to login
    if (!sessionCookie) {
      const callbackUrl = encodeURIComponent(pathname)
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${callbackUrl}`, origin)
      )
    }

    // Cookie exists - allow through (full validation happens in layout)
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*', // Protect all dashboard routes
  ],
}
