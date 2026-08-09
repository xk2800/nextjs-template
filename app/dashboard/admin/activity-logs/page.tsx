import { Suspense } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import SectionErrorFallback from "@/components/dashboard/sectionErrorFallback"
import ActivityLogsSection from "@/components/dashboard/admin/activityLogsSection"
import AdminActivityLogsSkeleton from "@/components/dashboard/admin/adminActivityLogsSkeleton"
import ImpersonationLogCard from "@/components/dashboard/admin/impersonationLogCard"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminActivityLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Review activity across all users
        </p>
      </div>

      <ErrorBoundary fallback={<SectionErrorFallback title="Impersonation log" />}>
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <ImpersonationLogCard showViewAllLink={false} />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary fallback={<SectionErrorFallback title="Events" />}>
        <Suspense fallback={<AdminActivityLogsSkeleton />}>
          <ActivityLogsSection />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
