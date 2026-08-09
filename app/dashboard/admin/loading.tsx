import { Skeleton } from "@/components/ui/skeleton"
import AdminStatsGridSkeleton from "@/components/dashboard/admin/adminStatsGridSkeleton"

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-80" />
      </div>

      <AdminStatsGridSkeleton />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  )
}
