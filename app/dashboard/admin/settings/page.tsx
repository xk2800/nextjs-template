import { Suspense } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import SectionErrorFallback from "@/components/dashboard/sectionErrorFallback"
import SystemSettingsSection from "@/components/dashboard/admin/systemSettingsSection"
import SystemSettingsSkeleton from "@/components/dashboard/admin/systemSettingsSkeleton"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Feature flags and maintenance mode — changes take effect immediately
        </p>
      </div>

      <ErrorBoundary fallback={<SectionErrorFallback title="Settings" />}>
        <Suspense fallback={<SystemSettingsSkeleton />}>
          <SystemSettingsSection />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
