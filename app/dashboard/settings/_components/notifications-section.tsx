import { Suspense } from "react"
import { requireAuth } from "@/lib/auth-helpers"
import { ErrorBoundary } from "@/components/error-boundary"
import SectionErrorFallback from "@/components/dashboard/sectionErrorFallback"
import MarketingUpdatesSection from "@/components/dashboard/marketingUpdatesSection"
import InstallAppCard from "@/components/dashboard/installAppCard"
import PushNotificationsCard from "@/components/site/push-notifications-card"
import { Skeleton } from "@/components/ui/skeleton"
import { MARKETING_SEGMENT_ID } from "@/lib/marketing"

export async function NotificationsSection() {
  const session = await requireAuth()

  return (
    <div className="space-y-6">
      {MARKETING_SEGMENT_ID && (
        <ErrorBoundary fallback={<SectionErrorFallback title="Email updates" />}>
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <MarketingUpdatesSection email={session.user.email} emailVerified={session.user.emailVerified} />
          </Suspense>
        </ErrorBoundary>
      )}
      <div>
        <h2 className="text-xl font-semibold">This device</h2>
        <p className="mt-1 text-sm text-muted-foreground">Push notifications and installing the app</p>
      </div>
      <PushNotificationsCard />
      <InstallAppCard />
    </div>
  )
}
