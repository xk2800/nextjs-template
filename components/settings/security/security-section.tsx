import { Suspense } from "react"
import { requireAuth } from "@xk2800/nextjs-template/auth/helpers"
import { ErrorBoundary } from "../../error-boundary"
import SectionErrorFallback from "../../dashboard/common/section-error-fallback"
import TwoFactorCard from "../../dashboard/settings/two-factor-card"
import PasskeysCard from "../../dashboard/settings/passkeys-card"
import SessionsSection from "../../dashboard/settings/sessions/sessions-section"
import SessionsCardSkeleton from "../../dashboard/settings/sessions/skeletons/sessions-card-skeleton"

export async function SecuritySection() {
  const session = await requireAuth()

  return (
    <div className="space-y-6">
      <TwoFactorCard />
      <PasskeysCard />
      <ErrorBoundary fallback={<SectionErrorFallback title="Active Sessions" />}>
        <Suspense fallback={<SessionsCardSkeleton />}>
          <SessionsSection userId={session.user.id} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
