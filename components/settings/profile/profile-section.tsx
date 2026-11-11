import { Suspense } from "react"
import { requireAuth, hasRole } from "@xk2800/nextjs-template/auth/helpers"
import { ErrorBoundary } from "../../error-boundary"
import SectionErrorFallback from "../../dashboard/common/section-error-fallback"
import ProfileCard from "../../dashboard/settings/profile-card"
import AccountDetailsCard from "../../dashboard/settings/account-details-card"
import AdminSection from "../../dashboard/settings/admin-section"
import ActivityLogsSection from "../../dashboard/settings/activity-logs-section"
import ActivityLogsCardSkeleton from "../../dashboard/settings/skeletons/activity-logs-card-skeleton"
import DeleteAccountCard from "../../dashboard/settings/delete-account-card"

export async function ProfileSection() {
  const session = await requireAuth()
  const isAdmin = hasRole(session.user.role, "admin")

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProfileCard user={session.user} isAdmin={isAdmin} />
        <AccountDetailsCard user={session.user} />
      </div>

      {isAdmin && <AdminSection />}

      <ErrorBoundary fallback={<SectionErrorFallback title="Activity Logs" />}>
        <Suspense fallback={<ActivityLogsCardSkeleton />}>
          <ActivityLogsSection userId={session.user.id} isAdmin={isAdmin} />
        </Suspense>
      </ErrorBoundary>

      <div>
        <h2 className="text-xl font-semibold">Danger zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">Irreversible actions on your account</p>
      </div>
      <DeleteAccountCard />
    </div>
  )
}
