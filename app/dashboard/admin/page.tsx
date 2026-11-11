import { Suspense } from "react"
import Link from "next/link"
import { Users, ScrollText, Settings, Megaphone } from "lucide-react"
import { ErrorBoundary } from "@/components/error-boundary"
import SectionErrorFallback from "@/components/dashboard/common/section-error-fallback"
import AdminStatsGrid from "@/components/dashboard/admin/home/admin-stats-grid"
import AdminStatsGridSkeleton from "@/components/dashboard/admin/home/skeletons/admin-stats-skeleton"
import DeviceThrottleCard from "@/components/dashboard/admin/home/device-throttle-card"
import NewDeviceCard from "@/components/dashboard/admin/home/new-device-card"
import SharedDeviceCard from "@/components/dashboard/admin/home/shared-device-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import SystemHealth from "@/components/admin/system-health"

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            System overview and quick access to management tools
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard/admin/users"><Users />Manage users</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/activity-logs"><ScrollText />Audit log</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/settings"><Settings />System settings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin/marketing"><Megaphone />Marketing</Link>
          </Button>
        </div>
      </div>

      <ErrorBoundary fallback={<SectionErrorFallback title="Stats" />}>
        <Suspense fallback={<AdminStatsGridSkeleton />}>
          <AdminStatsGrid />
        </Suspense>
      </ErrorBoundary>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ErrorBoundary fallback={<SectionErrorFallback title="Device throttle" />}>
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <DeviceThrottleCard />
            </Suspense>
          </ErrorBoundary>
        </div>
        <ErrorBoundary fallback={<SectionErrorFallback title="System health" />}>
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <SystemHealth />
          </Suspense>
        </ErrorBoundary>
      </div>

      <ErrorBoundary fallback={<SectionErrorFallback title="New devices" />}>
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <NewDeviceCard />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary fallback={<SectionErrorFallback title="Shared devices" />}>
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <SharedDeviceCard />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
