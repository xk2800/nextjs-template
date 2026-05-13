import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth-helpers"
import { getUserActivityLogs, getAllActivityLogs } from "@/lib/activity-queries"

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const isAdmin = hasRole(session.user.role, 'admin')

    if (isAdmin) {
      // Admins can see all activity logs
      const logs = await getAllActivityLogs(limit, offset)
      return NextResponse.json({ logs })
    } else {
      // Regular users can only see their own logs
      const logs = await getUserActivityLogs(session.user.id, limit)
      return NextResponse.json({ logs })
    }
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    )
  }
}
