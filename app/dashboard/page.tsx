import { Suspense } from "react"
import { requireAuth, hasRole } from "@/lib/auth-helpers"
import { ErrorBoundary } from "@/components/error-boundary"
import SectionErrorFallback from "@/components/dashboard/sectionErrorFallback"
import ProfileCard from "@/components/dashboard/profileCard"
import AccountDetailsCard from "@/components/dashboard/accountDetailsCard"
import SessionsSection from "@/components/dashboard/sessionsSection"
import SessionsCardSkeleton from "@/components/dashboard/sessionsCardSkeleton"
import AdminStatsSection from "@/components/dashboard/adminStatsSection"
import AdminSectionSkeleton from "@/components/dashboard/adminSectionSkeleton"
import ActivityLogsSection from "@/components/dashboard/activityLogsSection"
import ActivityLogsCardSkeleton from "@/components/dashboard/activityLogsCardSkeleton"

export default async function DashboardPage() {
  const session = await requireAuth()
  const isAdmin = hasRole(session.user.role, 'admin')

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
      <ErrorBoundary fallback={<SectionErrorFallback title="Active Sessions" />}>
        <Suspense fallback={<SessionsCardSkeleton />}>
          <SessionsSection userId={session.user.id} />
        </Suspense>
      </ErrorBoundary>

      {/* Admin-Only Section */}
      {isAdmin && (
        <ErrorBoundary fallback={<SectionErrorFallback title="Admin overview" />}>
          <Suspense fallback={<AdminSectionSkeleton />}>
            <AdminStatsSection />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Activity Logs Section */}
      <ErrorBoundary fallback={<SectionErrorFallback title="Activity Logs" />}>
        <Suspense fallback={<ActivityLogsCardSkeleton />}>
          <ActivityLogsSection userId={session.user.id} isAdmin={isAdmin} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
