import { requireAuth, hasRole } from "@/lib/auth-helpers"
import { cookies } from "next/headers"
import { getUserSessions } from "@/lib/session-queries"
import ProfileCard from "./components/profileCard"
import SessionsCard from "./components/sessionsCard"
import AccountDetailsCard from "./components/accountDetailsCard"
import AdminSection from "./components/adminSection"
import ActivityLogsCard from "./components/activityLogsCard"

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
        <ProfileCard user={session.user} />

        {/* Account Details */}
        <AccountDetailsCard user={session.user} />
      </div>

      {/* Sessions Section (Full Width) */}
      <SessionsCard
        userId={session.user.id}
        initialSessions={allSessions}
        currentSessionToken={currentSessionToken}
      />

      {/* Admin-Only Section */}
      {isAdmin && <AdminSection />}

      {/* Activity Logs Section */}
      <ActivityLogsCard isAdmin={isAdmin} />
    </div>
  )
}
