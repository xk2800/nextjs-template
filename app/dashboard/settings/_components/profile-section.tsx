import { Suspense } from "react"
import { requireAuth, hasRole } from "@/lib/auth-helpers"
import { ErrorBoundary } from "@/components/error-boundary"
import SectionErrorFallback from "@/components/dashboard/sectionErrorFallback"
import ProfileCard from "@/components/dashboard/profileCard"
import AccountDetailsCard from "@/components/dashboard/accountDetailsCard"
import AdminSection from "@/components/dashboard/adminSection"
import ActivityLogsSection from "@/components/dashboard/activityLogsSection"
import ActivityLogsCardSkeleton from "@/components/dashboard/activityLogsCardSkeleton"
import DeleteAccountCard from "@/components/dashboard/deleteAccountCard"

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
