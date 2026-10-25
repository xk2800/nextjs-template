import { Suspense } from "react"
import { getMarketingOverview } from "@xk2800/nextjs-template/marketing"
import { formatDateTime } from "@xk2800/nextjs-template/lib/formatters"
import { Skeleton } from "../../ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import { Badge } from "../../ui/badge"
import MarketingEmailForm from "./marketingEmailForm"
import BroadcastActions from "./broadcastActions"
import SubscribersCard from "./subscribersCard"

// Admin marketing email page body: compose form, recent broadcasts and
// subscribers. `segmentId` picks the Subscribers segment (e.g. from
// ?segment=); unknown or missing falls back to the first segment.
export default async function MarketingSection({ segmentId }: { segmentId?: string }) {
  const { segments, broadcasts, error } = await getMarketingOverview()

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resend isn&apos;t reachable</CardTitle>
          <CardDescription>
            {error} Broadcasts need a <strong>full access</strong> API key (a sending-only key can&apos;t list segments).
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <MarketingEmailForm segments={segments} />

      {broadcasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent broadcasts</CardTitle>
            <CardDescription>Open, click and unsubscribe stats are in the Resend dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {broadcasts.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2 text-sm">
                  <span className="truncate">{b.name || "(untitled)"}</span>
                  <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    {formatDateTime(b.sent_at ?? b.created_at)}
                    <Badge variant={b.status === "sent" ? "default" : "secondary"}>{b.status}</Badge>
                    <BroadcastActions id={b.id} name={b.name || "(untitled)"} status={b.status} />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {segments.length > 0 && (
        <Suspense fallback={<Skeleton className="h-48 w-full" />}>
          <SubscribersCard
            segments={segments}
            segmentId={segments.some((s) => s.id === segmentId) ? segmentId! : segments[0].id}
          />
        </Suspense>
      )}
    </div>
  )
}
