import { Skeleton } from "@/components/ui/skeleton"
import SystemSettingsSkeleton from "@/components/dashboard/admin/systemSettingsSkeleton"

export default function AdminSettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-96" />
      </div>

      <SystemSettingsSkeleton />
    </div>
  )
}
