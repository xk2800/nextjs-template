import { Suspense } from "react"
import { getBroadcastResend, BROADCAST_API_KEY } from "@/lib/resend"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/lib/formatters"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import MarketingEmailForm from "./marketingEmailForm"
import BroadcastActions from "./broadcastActions"
import SubscribersCard from "./subscribersCard"

export default async function AdminMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string }>
}) {
  const { segment } = await searchParams
  let segments: { id: string; name: string }[] = []
  let broadcasts: { id: string; name: string | null; status: string; created_at: string; sent_at: string | null }[] = []
  let loadError: string | null = null

  if (!BROADCAST_API_KEY) {
    loadError = "Neither RESEND_BROADCAST_API_KEY nor RESEND_API_KEY is set."
  } else {
    const resend = await getBroadcastResend()
    const [segRes, bcRes] = await Promise.all([
      resend.segments.list(),
      resend.broadcasts.list({ limit: 10 }),
    ])
    if (segRes.error) loadError = segRes.error.message
    else segments = segRes.data.data
    if (bcRes.data) broadcasts = bcRes.data.data
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing email</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Send updates to a Resend segment as a broadcast. Broadcasts use your Resend marketing
          quota, not the transactional daily limit.
        </p>
      </div>

      {loadError ? (
        <Card>
          <CardHeader>
            <CardTitle>Resend isn&apos;t reachable</CardTitle>
            <CardDescription>
              {loadError} Broadcasts need a <strong>full access</strong> API key (a sending-only key can&apos;t list segments).
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <MarketingEmailForm segments={segments} />
      )}

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
            segmentId={segments.some((s) => s.id === segment) ? segment! : segments[0].id}
          />
        </Suspense>
      )}
    </div>
  )
}
