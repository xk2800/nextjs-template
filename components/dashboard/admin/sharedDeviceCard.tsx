import Link from "next/link"
import { Fingerprint, ShieldAlert } from "lucide-react"
import { getSharedDeviceAccounts } from "@xk2800/nextjs-template/admin/queries"
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

// One physical device (FingerprintJS visitorId) that 3+ accounts have signed in
// from — the multi-account / trial-abuse signal. Each account links to its admin
// detail page, where it can be banned. Sits next to the Device throttle and New
// devices cards; a shared device that's also failing logins shows on all three.
export default async function SharedDeviceCard() {
  const devices = await getSharedDeviceAccounts(20)

  return (
    <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-500/[0.04]">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Fingerprint className="size-4" />
          <CardTitle>Shared devices</CardTitle>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
            <ShieldAlert className="size-3" />
            Security
          </span>
          {devices.length > 0 && (
            <Badge variant="destructive">{devices.length} flagged</Badge>
          )}
        </div>
        <CardDescription>
          One device signed into by three or more accounts — a multi-account /
          trial-abuse signal. Open an account to ban it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No devices shared across 3+ accounts</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device fingerprint</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Accounts</TableHead>
                  <TableHead>Shared by</TableHead>
                  <TableHead>Last seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((d) => (
                  <TableRow key={d.visitorId}>
                    <TableCell className="font-mono text-xs select-all whitespace-nowrap align-top">
                      {d.visitorId}
                    </TableCell>
                    <TableCell className="text-sm align-top">
                      {[d.browser, d.os].filter(Boolean).join(" · ") || "Unknown"}
                      <span className="block text-xs text-muted-foreground">{d.deviceType}</span>
                    </TableCell>
                    <TableCell className="text-sm align-top">
                      {[d.city, d.country].filter(Boolean).join(", ") || "Unknown"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums align-top">
                      {d.accountCount}
                    </TableCell>
                    <TableCell className="text-sm align-top">
                      <ul className="space-y-1">
                        {d.accounts.map((a) => (
                          <li key={a.userId}>
                            <Link
                              href={`/dashboard/admin/users/${a.userId}`}
                              className="font-medium hover:underline"
                            >
                              {a.userName}
                            </Link>
                            {a.banned && (
                              <Badge variant="outline" className="ml-2">Banned</Badge>
                            )}
                            <span className="block text-xs text-muted-foreground">
                              {a.userEmail} · first seen {formatDateTime(a.firstSeenAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground align-top">
                      {formatDateTime(d.lastSeenAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
