import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/server/auth"
import { hasRole } from "@/lib/auth-helpers"
import { getImpersonationSessions } from "@/lib/impersonation-queries"
import { unexpectedErrorMessage } from "@/lib/errors"

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasRole(session.user.role, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const sp = request.nextUrl.searchParams
    return NextResponse.json(
      await getImpersonationSessions({
        search: sp.get("search") || "",
        status: sp.get("status") || undefined,
        page: Math.max(1, parseInt(sp.get("page") || "1")),
      })
    )
  } catch (error) {
    return NextResponse.json({ error: unexpectedErrorMessage(error, "Failed to load impersonation sessions") }, { status: 500 })
  }
}
