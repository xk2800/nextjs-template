import { Suspense } from "react"
import Link from "next/link"
import { Users, ScrollText, Settings } from "lucide-react"
import { ErrorBoundary } from "@/components/error-boundary"
import SectionErrorFallback from "@/components/dashboard/sectionErrorFallback"
import AdminStatsGrid from "@/components/dashboard/admin/adminStatsGrid"
import AdminStatsGridSkeleton from "@/components/dashboard/admin/adminStatsGridSkeleton"
import DeviceThrottleCard from "@/components/dashboard/admin/deviceThrottleCard"
import NewDeviceCard from "@/components/dashboard/admin/newDeviceCard"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          System overview and quick access to management tools
        </p>
      </div>

      <ErrorBoundary fallback={<SectionErrorFallback title="Stats" />}>
        <Suspense fallback={<AdminStatsGridSkeleton />}>
          <AdminStatsGrid />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary fallback={<SectionErrorFallback title="Device throttle" />}>
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <DeviceThrottleCard />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary fallback={<SectionErrorFallback title="New devices" />}>
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <NewDeviceCard />
        </Suspense>
      </ErrorBoundary>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Link href="/dashboard/admin/users">
          <Button className="w-full">
            <Users />
            Manage users
          </Button>
        </Link>
        <Link href="/dashboard/admin/activity-logs">
          <Button variant="outline" className="w-full">
            <ScrollText />
            View audit log
          </Button>
        </Link>
        <Link href="/dashboard/admin/settings">
          <Button variant="outline" className="w-full">
            <Settings />
            System settings
          </Button>
        </Link>
      </div>
    </div>
  )
}
