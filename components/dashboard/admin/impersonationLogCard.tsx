import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { getRecentImpersonationEvents } from "@xk2800/nextjs-template/activity/queries"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { formatDateTime } from "../../../lib/formatters"

// Dedicated, always-visible feed of who's been logging in as whom — so an
// admin can see this at a glance instead of having to remember to filter the
// generic activity log for it. Rendered on both the Users page (where the
// impersonated accounts live) and the Audit Logs page. Styled like
// adminSection.tsx's amber callout to read as a distinct, security-sensitive
// section rather than just another card in the list.
interface ImpersonationLogCardProps {
  // Skip the "View full log" link on the Audit Logs page itself, since the
  // full filterable table is already right below this card there.
  showViewAllLink?: boolean
}

export default async function ImpersonationLogCard({ showViewAllLink = true }: ImpersonationLogCardProps) {
  const events = await getRecentImpersonationEvents(10)

  return (
    <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-500/[0.04]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Impersonation log</CardTitle>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
            <ShieldAlert className="size-3" />
            Security
          </span>
        </div>
        <CardDescription>Most recent admin impersonation activity</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No impersonation activity recorded</p>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <Badge variant={event.action === 'impersonation_started' ? 'destructive' : 'secondary'}>
                    {event.action === 'impersonation_started' ? 'Started' : 'Stopped'}
                  </Badge>
                  <div>
                    <p className="text-sm">{event.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      by {event.adminName || event.adminEmail || event.adminId}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatDateTime(event.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {showViewAllLink && (
          <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-900/40">
            <Link
              href="/dashboard/admin/activity-logs"
              className="text-sm font-medium text-amber-900 hover:underline dark:text-amber-400"
            >
              View full audit log →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
