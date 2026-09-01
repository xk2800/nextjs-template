import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import {
  getDeviceThrottleActivity,
  type DeviceThrottleRow,
} from "@xk2800/nextjs-template/admin/queries"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import { Badge } from "../../ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table"
import { formatDateTime } from "../../../lib/formatters"

// Live view of devices accumulating failed sign-ins / sign-up attempts, keyed
// by FingerprintJS visitorId (see lib/auth-throttle.ts). Every column an admin
// needs to block the source is here — fingerprint and IP are `select-all` so
// they can be dragged straight into a firewall / WAF / reverse-proxy rule.
// The historical per-account trail lives in the audit log (login_failed).
interface DeviceThrottleCardProps {
  // Hidden on the Audit Logs page, where the full failed-login table is right below.
  showHistoryLink?: boolean
}

function statusBadge(row: DeviceThrottleRow) {
  if (row.blocked && row.windowActive) return <Badge variant="destructive">Blocked</Badge>
  if (row.windowActive) return <Badge variant="secondary">Watching</Badge>
  return <Badge variant="outline">Cooled off</Badge>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Fingerprint</TableHead>
                  <TableHead>IP address</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Target email</TableHead>
                  <TableHead>Window started</TableHead>
                  <TableHead>Last attempt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.fingerprint}>
                    <TableCell>{statusBadge(row)}</TableCell>
                    <TableCell className="font-mono text-xs select-all whitespace-nowrap">
                      {row.fingerprint}
                    </TableCell>
                    <TableCell className="font-mono text-xs select-all">
                      {row.ipAddress || "Unknown"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {[row.browser, row.os].filter(Boolean).join(" · ") || "Unknown"}
                      <span className="block text-xs text-muted-foreground">{row.deviceType}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {[row.city, row.country].filter(Boolean).join(", ") || "Unknown"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{row.count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.lastKind === "signup" ? "sign-up" : "sign-in"}
                    </TableCell>
                    <TableCell className="text-sm select-all">{row.lastEmail || "—"}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDateTime(row.windowStart)}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDateTime(row.lastAttemptAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
