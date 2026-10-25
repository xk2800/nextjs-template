import { Suspense } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import SectionErrorFallback from "@/components/dashboard/sectionErrorFallback"
import MarketingSection from "@/components/dashboard/admin/marketingSection"
import { Skeleton } from "@/components/ui/skeleton"

export default async function AdminMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string }>
}) {
  const { segment } = await searchParams

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing email</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Send updates to a Resend segment as a broadcast. Broadcasts use your Resend marketing
          quota, not the transactional daily limit.
        </p>
      </div>

      <ErrorBoundary fallback={<SectionErrorFallback title="Marketing email" />}>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <MarketingSection segmentId={segment} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
