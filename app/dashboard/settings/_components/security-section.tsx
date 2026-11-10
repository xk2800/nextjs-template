import { Suspense } from "react"
import { requireAuth } from "@/lib/auth-helpers"
import { ErrorBoundary } from "@/components/error-boundary"
import SectionErrorFallback from "@/components/dashboard/sectionErrorFallback"
import TwoFactorCard from "@/components/dashboard/twoFactorCard"
import PasskeysCard from "@/components/dashboard/passkeysCard"
import SessionsSection from "@/components/dashboard/sessionsSection"
import SessionsCardSkeleton from "@/components/dashboard/sessionsCardSkeleton"

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
