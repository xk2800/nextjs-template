import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { getDeviceThrottleActivity } from "@xk2800/nextjs-template/admin/queries"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import { Badge } from "../../ui/badge"
import DeviceThrottleTable from "./deviceThrottleTable"

// Live view of devices accumulating failed sign-ins / sign-up attempts, keyed
// by FingerprintJS visitorId (see lib/auth-throttle.ts). Every column an admin
// needs to block the source is here — fingerprint and IP are `select-all` so
// they can be dragged straight into a firewall / WAF / reverse-proxy rule.
// The historical per-account trail lives in the audit log (login_failed).
interface DeviceThrottleCardProps {
  // Hidden on the Audit Logs page, where the full failed-login table is right below.
  showHistoryLink?: boolean
}

export default async function DeviceThrottleCard({ showHistoryLink = true }: DeviceThrottleCardProps) {
  const rows = await getDeviceThrottleActivity(50)
  const blockedNow = rows.filter((r) => r.blocked && r.windowActive).length

  return (
    <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-500/[0.04]">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Device throttle</CardTitle>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
            <ShieldAlert className="size-3" />
            Security
          </span>
          {blockedNow > 0 && (
            <Badge variant="destructive">{blockedNow} blocked right now</Badge>
          )}
        </div>
        <CardDescription>
          Fingerprints hitting the sign-in / sign-up abuse limit. Fingerprint and IP
          are click-to-select for a block rule.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No abuse activity detected</p>
        ) : (
          <DeviceThrottleTable rows={rows} />
        )}
        {showHistoryLink && (
          <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-900/40">
            <Link
              href="/dashboard/admin/activity-logs"
              className="text-sm font-medium text-amber-900 hover:underline dark:text-amber-400"
            >
              View failed sign-in history →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
