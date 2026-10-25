import Link from "next/link"
import { getBroadcastResend } from "@/lib/resend"
import { formatDateTime } from "@/lib/formatters"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// ponytail: first 100 contacts only (one Resend page); add cursor paging
// (`after`) if a segment outgrows it.
const LIMIT = 100

export default async function SubscribersCard({
  segments,
  segmentId,
}: {
  segments: { id: string; name: string }[]
  segmentId: string
}) {
  const { data, error } = await (await getBroadcastResend()).contacts.list({ segmentId, limit: LIMIT })
  const contacts = data?.data ?? []
  const subscribed = contacts.filter((c) => !c.unsubscribed).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscribers</CardTitle>
        <CardDescription>
          {error
            ? `Couldn't load contacts: ${error.message}`
            : `${subscribed} subscribed, ${contacts.length - subscribed} unsubscribed${data?.has_more ? ` (first ${LIMIT} shown)` : ""}. Add or import contacts in Resend → Audience.`}
        </CardDescription>
        {segments.length > 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {segments.map((s) => (
              <Button key={s.id} asChild size="sm" variant={s.id === segmentId ? "default" : "outline"}>
                <Link href={`?segment=${s.id}`} scroll={false}>{s.name}</Link>
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      {contacts.length > 0 && (
        <CardContent>
          <ul className="divide-y">
            {contacts.map((c) => {
              const name = [c.first_name, c.last_name].filter(Boolean).join(" ")
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-sm">
                  <span className="min-w-0 truncate">
                    {c.email}
                    {name && <span className="text-muted-foreground"> · {name}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                    {formatDateTime(c.created_at)}
                    <Badge variant={c.unsubscribed ? "secondary" : "default"}>
                      {c.unsubscribed ? "unsubscribed" : "subscribed"}
                    </Badge>
                  </span>
                </li>
              )
            })}
          </ul>
        </CardContent>
      )}
    </Card>
  )
}
