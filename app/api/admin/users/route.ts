import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth-helpers"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { like, desc, or, and } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin
  if (!hasRole(session.user.role, 'admin')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build search query
    let query = db.select().from(users)

    if (search.trim()) {
      query = query.where(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      ) as any
    }

    // Get total count
    const countResult = await db.select({ count: db.sql`count(*)` })
      .from(users)
      .where(
        search.trim() ?
          or(
            like(users.name, `%${search}%`),
            like(users.email, `%${search}%`)
          ) : undefined
      ) as any

    const total = parseInt(countResult[0]?.count?.toString() || '0')

    // Get paginated results
    const usersList = await (query as any)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      users: usersList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
