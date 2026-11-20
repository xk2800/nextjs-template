import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { requireAdminApi } from "@/lib/auth/helpers"
import { getUsersFiltered } from "@/lib/db/queries/user"
import { clampInt } from "@/lib/utils/pagination"
import { unexpectedErrorMessage } from "@/lib/utils/errors"

export async function GET(request: NextRequest) {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = clampInt(searchParams.get('page'), 1, 1, 100_000)
    const limit = clampInt(searchParams.get('limit'), 10, 1, 100)

    const { users: usersList, total, pages } = await getUsersFiltered({ search, role: searchParams.get('role') || undefined, status: searchParams.get('status') || undefined, page, limit })

    return NextResponse.json({
      users: usersList,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: unexpectedErrorMessage(error, "Failed to fetch users") },
      { status: 500 }
    )
  }
}
