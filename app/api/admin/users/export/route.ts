import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/auth/helpers"
import { getUsersForExport } from "@/lib/db/queries/user"
import { toCsv } from "@/lib/utils/csv"
import { unexpectedErrorMessage } from "@/lib/utils/errors"

export async function GET(request: NextRequest) {
  const session = await requireAdminApi()
  if (session instanceof NextResponse) return session

  try {
    const search = request.nextUrl.searchParams.get('search') || ''

    const usersList = await getUsersForExport({ search, role: request.nextUrl.searchParams.get('role') || undefined, status: request.nextUrl.searchParams.get('status') || undefined })

    const csv = toCsv(
      ['Name', 'Email', 'Role', 'Status', 'Banned Reason', 'Last Login', 'Last Active', 'Joined'],
      usersList.map((user) => [
        user.name,
        user.email,
        user.role,
        user.banned ? 'Banned' : 'Active',
        user.bannedReason,
        user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : '',
        user.lastActiveAt ? new Date(user.lastActiveAt).toISOString() : '',
        new Date(user.createdAt).toISOString(),
      ])
    )

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: unexpectedErrorMessage(error, "Failed to export users") },
      { status: 500 }
    )
  }
}
