import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth-helpers"
import { getActivityLogsForExport, type ActivityActionFilter } from "@/lib/activity-queries"
import { ActivityActionEnum } from "@/server/db/schema"
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
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const actionParam = searchParams.get('action') || ''
    const dateFromParam = searchParams.get('dateFrom')
    const dateToParam = searchParams.get('dateTo')

    const action = (ActivityActionEnum.enumValues as readonly string[]).includes(actionParam)
      ? (actionParam as ActivityActionFilter)
      : undefined

    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined
    // Treat dateTo as inclusive of the whole day
    const dateTo = dateToParam ? new Date(`${dateToParam}T23:59:59.999`) : undefined

    const logs = await getActivityLogsForExport({ search, action, dateFrom, dateTo })

    const csv = toCsv(
      ['Action', 'User Name', 'User Email', 'Description', 'IP Address', 'User Agent', 'Time'],
      logs.map((log) => [
        log.action,
        log.userName,
        log.userEmail,
        log.description,
        log.ipAddress,
        log.userAgent,
        new Date(log.createdAt).toISOString(),
      ])
    )

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting activity logs:', error)
    return NextResponse.json(
      { error: "Failed to export activity logs" },
      { status: 500 }
    )
  }
}
