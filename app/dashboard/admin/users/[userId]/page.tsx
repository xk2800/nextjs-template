import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getUserById, getUserInviteExpiry, getUserInviteInfo, getUserSecurity } from "@/lib/user-queries"
import { getUserSessions } from "@/lib/session-queries"
import { getUserActivityLogs, getUserLoginHistory } from "@/lib/activity-queries"
import { getCurrentSession } from "@/lib/auth-helpers"
import { parseUserAgent, lookupGeoLocation, formatDeviceInfo, formatLocation } from "@/lib/request-info"
import { Button } from "@/components/ui/button"
import AdminUserProfileCard from "@/components/dashboard/admin/adminUserProfileCard"
import AdminUserSecurityCard from "@/components/dashboard/admin/adminUserSecurityCard"
import { AdminUserHeaderActions, AdminUserDangerZone } from "@/components/dashboard/admin/adminUserActions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminUserStatusCard from "@/components/dashboard/admin/adminUserStatusCard"
import AdminUserSessionsCard from "@/components/dashboard/admin/adminUserSessionsCard"
import AdminUserActivityLogCard from "@/components/dashboard/admin/adminUserActivityLogCard"
import AdminUserLoginInfoCard from "@/components/dashboard/admin/adminUserLoginInfoCard"
import AdminUserDevicesCard from "@/components/dashboard/admin/adminUserDevicesCard"
import AdminUserConsentCard from "@/components/dashboard/admin/adminUserConsentCard"
import { getUserConsentLog, getUserDevices } from "@/lib/admin-queries"
import { getSystemSettings, isConsentRequired } from "@/lib/settings-queries"

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { userId } = await params
  const { tab } = await searchParams
  const user = await getUserById(userId)

  if (!user) {
    notFound()
  }

  const [rawSessions, activityLogs, loginHistory, devices, consentRecords, settings, inviteExpiresAt, inviteInfo, security, currentSession] = await Promise.all([
    getUserSessions(userId),
    getUserActivityLogs(userId, 50),
    getUserLoginHistory(userId, 20),
    getUserDevices(userId),
    getUserConsentLog(userId),
    getSystemSettings(),
    getUserInviteExpiry(userId),
    getUserInviteInfo(userId, user.email),
    getUserSecurity(userId, user.twoFactorEnabled),
    getCurrentSession(),
  ])

  // Client component can't parse user-agent/IP itself (geoip-lite needs
  // Node fs access), so precompute the display strings here.
  const sessions = rawSessions.map((s) => ({
    ...s,
    deviceLabel: formatDeviceInfo(parseUserAgent(s.userAgent)),
    location: formatLocation(lookupGeoLocation(s.ipAddress)),
  }))

  const isSelf = currentSession?.user.id === user.id
  const target = { id: user.id, email: user.email, role: user.role, banned: user.banned }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
        <AdminUserHeaderActions user={target} isSelf={isSelf} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <AdminUserProfileCard user={user} />
          <AdminUserStatusCard user={{ ...user, inviteExpiresAt, ...inviteInfo }} />
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">Danger zone</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminUserDangerZone user={target} isSelf={isSelf} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue={tab === "sessions" || tab === "activity" ? tab : "overview"}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <AdminUserSecurityCard security={security} />
              <AdminUserLoginInfoCard logins={loginHistory} />
              <AdminUserDevicesCard devices={devices} />
              <AdminUserConsentCard records={consentRecords} consentRequired={isConsentRequired(settings)} />
            </TabsContent>

            <TabsContent value="sessions">
              <AdminUserSessionsCard userId={user.id} initialSessions={sessions} />
            </TabsContent>

            <TabsContent value="activity">
              <AdminUserActivityLogCard logs={activityLogs} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
