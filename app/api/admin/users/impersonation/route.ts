import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/auth/helpers"
import { getImpersonationSessions } from "@/lib/db/queries/impersonation"
import { clampInt } from "@/lib/utils/pagination"
import { unexpectedErrorMessage } from "@/lib/utils/errors"

export async function GET(request: NextRequest) {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session
  try {
    const sp = request.nextUrl.searchParams
    return NextResponse.json(
      await getImpersonationSessions({
        search: sp.get("search") || "",
        status: sp.get("status") || undefined,
        page: clampInt(sp.get("page"), 1, 1, 100_000),
      })
    )
  } catch (error) {
    return NextResponse.json({ error: unexpectedErrorMessage(error, "Failed to load impersonation sessions") }, { status: 500 })
  }
}
