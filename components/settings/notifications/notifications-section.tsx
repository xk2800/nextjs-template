import { Suspense } from "react"
import { requireAuth } from "@xk2800/nextjs-template/auth/helpers"
import { ErrorBoundary } from "../../error-boundary"
import SectionErrorFallback from "../../dashboard/common/section-error-fallback"
import MarketingUpdatesSection from "../../dashboard/settings/marketing-updates-section"
import InstallAppCard from "../../dashboard/overview/install-app-card"
import PushNotificationsCard from "../../site/push/push-notifications-card"
import { Skeleton } from "../../ui/skeleton"
import { MARKETING_SEGMENT_ID } from "@xk2800/nextjs-template/marketing"

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
