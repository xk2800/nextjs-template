import { requireAuth, hasRole } from "@/lib/auth-helpers"
import { cookies } from "next/headers"
import { getUserSessions } from "@/lib/session-queries"
import { getAdminStats } from "@/lib/admin-queries"
import { config } from "@/config/env"
import ProfileCard from "@/components/dashboard/profileCard"
import SessionsCard from "@/components/dashboard/sessionsCard"
import AccountDetailsCard from "@/components/dashboard/accountDetailsCard"
import AdminSection from "@/components/dashboard/adminSection"
import ActivityLogsCard from "@/components/dashboard/activityLogsCard"

export default async function DashboardPage() {
  const session = await requireAuth()
  const isAdmin = hasRole(session.user.role, 'admin')

  // Get all sessions and current session token
  const allSessions = await getUserSessions(session.user.id)
  const cookieStore = await cookies()
  const currentSessionToken = cookieStore.get('better-auth.session_token')?.value || ''

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back, {session.user.name}
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <ProfileCard user={session.user} isAdmin={isAdmin} />

        {/* Account Details */}
        <AccountDetailsCard user={session.user} />
      </div>

      {/* Sessions Section (Full Width) */}
      <SessionsCard
        userId={session.user.id}
        initialSessions={allSessions}
        currentSessionToken={currentSessionToken}
        enableSessionRevocation={config.ENABLE_SESSION_REVOCATION}
      />

      {/* Admin-Only Section */}
      {isAdmin && <AdminSection stats={await getAdminStats()} />}

      {/* Activity Logs Section */}
      <ActivityLogsCard isAdmin={isAdmin} />
    </div>
  )
}
