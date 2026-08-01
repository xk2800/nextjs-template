import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth-helpers"
import { getActivityLogsFiltered, type ActivityActionFilter } from "@/lib/activity-queries"
import { ActivityActionEnum } from "@/server/db/schema"

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
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const actionParam = searchParams.get('action') || ''
    const dateFromParam = searchParams.get('dateFrom')
    const dateToParam = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const action = (ActivityActionEnum.enumValues as readonly string[]).includes(actionParam)
      ? (actionParam as ActivityActionFilter)
      : undefined

    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined
    // Treat dateTo as inclusive of the whole day
    const dateTo = dateToParam ? new Date(`${dateToParam}T23:59:59.999`) : undefined

    const { logs, total, pages } = await getActivityLogsFiltered({
      search,
      action,
      dateFrom,
      dateTo,
      page,
      limit,
    })

    return NextResponse.json({
      logs,
      pagination: { page, limit, total, pages },
    })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    )
  }
}
