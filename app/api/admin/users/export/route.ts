import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth-helpers"
import { getUsersForExport } from "@/lib/user-queries"
import { toCsv } from "@/lib/csv"

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasRole(session.user.role, 'admin')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const search = request.nextUrl.searchParams.get('search') || ''

    const usersList = await getUsersForExport({ search })

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
    console.error('Error exporting users:', error)
    return NextResponse.json(
      { error: "Failed to export users" },
      { status: 500 }
    )
  }
}
