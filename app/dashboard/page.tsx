import { requireAuth, hasRole } from "@/lib/auth-helpers"
import ProfileCard from "./components/profileCard"
import SessionsCard from "./components/sessionsCard"
import AccountDetailsCard from "./components/accountDetailsCard"
import AdminSection from "./components/adminSection"

export default async function DashboardPage() {
  const session = await requireAuth()
  const isAdmin = hasRole(session.user.role, 'admin')

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">
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
      <SessionsCard userId={session.user.id} />

      {/* Admin-Only Section */}
      {isAdmin && <AdminSection />}
    </div>
  )
}
