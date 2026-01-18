import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { db } from "@/server/db"
import { users, sessions } from "@/server/db/schema"
import { sql } from "drizzle-orm"

async function getAdminStats() {
  // Get total users
  const totalUsersResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(users)
  const totalUsers = totalUsersResult[0]?.count || 0

  // Get total active sessions
  const now = new Date()
  const activeSessionsResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(sessions)
    .where(sql`${sessions.expiresAt} > ${now}`)
  const activeSessions = activeSessionsResult[0]?.count || 0

  // Get admin count
  const adminCountResult = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(users)
    .where(sql`${users.role} = 'admin'`)
  const adminCount = adminCountResult[0]?.count || 0

  return {
    totalUsers,
    activeSessions,
    adminCount,
    regularUsers: totalUsers - adminCount,
  }
}

export default async function AdminSection() {
  const stats = await getAdminStats()

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Admin Overview</CardTitle>
          <Badge variant="default">Admin Only</Badge>
        </div>
        <CardDescription>
          System statistics and user management preview
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm font-medium text-gray-600">Total Users</p>
            <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm font-medium text-gray-600">Active Sessions</p>
            <p className="text-3xl font-bold mt-2">{stats.activeSessions}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm font-medium text-gray-600">Admins</p>
            <p className="text-3xl font-bold mt-2">{stats.adminCount}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm font-medium text-gray-600">Regular Users</p>
            <p className="text-3xl font-bold mt-2">{stats.regularUsers}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Future: Full user management interface will be added here
        </p>
      </CardContent>
    </Card>
  )
}
