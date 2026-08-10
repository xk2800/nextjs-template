import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getUserById } from "@/lib/user-queries"
import { getUserSessions } from "@/lib/session-queries"
import { getUserActivityLogs, getUserLoginHistory } from "@/lib/activity-queries"
import { hasRole } from "@/lib/auth-helpers"
import { parseUserAgent, lookupGeoLocation, formatDeviceInfo, formatLocation } from "@/lib/request-info"
import { Button } from "@/components/ui/button"
import ProfileCard from "@/components/dashboard/profileCard"
import AccountDetailsCard from "@/components/dashboard/accountDetailsCard"
import AdminUserStatusCard from "@/components/dashboard/admin/adminUserStatusCard"
import AdminUserSessionsCard from "@/components/dashboard/admin/adminUserSessionsCard"
import AdminUserActivityLogCard from "@/components/dashboard/admin/adminUserActivityLogCard"
import AdminUserLoginInfoCard from "@/components/dashboard/admin/adminUserLoginInfoCard"

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const user = await getUserById(userId)

  if (!user) {
    notFound()
  }

  const [rawSessions, activityLogs, loginHistory] = await Promise.all([
    getUserSessions(userId),
    getUserActivityLogs(userId, 50),
    getUserLoginHistory(userId, 20),
  ])

  // Client component can't parse user-agent/IP itself (geoip-lite needs
  // Node fs access), so precompute the display strings here.
  const sessions = rawSessions.map((s) => ({
    ...s,
    deviceLabel: formatDeviceInfo(parseUserAgent(s.userAgent)),
    location: formatLocation(lookupGeoLocation(s.ipAddress)),
  }))

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/dashboard/admin/users">
            <ArrowLeft />
            Back to Users
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{user.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileCard user={user} isAdmin={hasRole(user.role, 'admin')} />
        <AdminUserStatusCard user={user} />
      </div>

      <AccountDetailsCard user={user} />

      <AdminUserSessionsCard userId={user.id} initialSessions={sessions} />

      <AdminUserLoginInfoCard logins={loginHistory} />

      <AdminUserActivityLogCard logs={activityLogs} />
    </div>
  )
}
