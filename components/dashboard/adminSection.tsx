import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

export interface AdminStats {
  totalUsers: number
  activeSessions: number
  adminCount: number
  regularUsers: number
}

export default function AdminSection({ stats }: { stats: AdminStats }) {
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

        <Link href="/dashboard/admin/users" className="block mt-4">
          <Button className="w-full">Manage Users</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
