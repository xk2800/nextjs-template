import Link from "next/link"
import { MonitorSmartphone } from "lucide-react"
import { getRecentNewDevices } from "@xk2800/nextjs-template/admin/queries"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table"
import { formatDateTime } from "../../../lib/formatters"
import RevokeAllSessionsButton from "./revokeAllSessionsButton"

// First sign-in from a device for each account (written by
// app/api/device-check/route.ts). The user and every admin also get an email;
// this is the durable, at-a-glance surface. If a row looks like a hijack,
// "Revoke sessions" logs that account out everywhere in one click, or open the
// account for the full session list / activity trail.
export default async function NewDeviceCard() {
  const rows = await getRecentNewDevices(20)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <MonitorSmartphone className="size-4" />
          <CardTitle>New devices</CardTitle>
        </div>
        <CardDescription>
          First sign-in from a device for each account, newest first. Revoke the
          account&apos;s sessions if the sign-in wasn&apos;t them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No new-device sign-ins recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>IP address</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm">
                      <Link
                        href={`/dashboard/admin/users/${row.userId}`}
                        className="font-medium hover:underline"
                      >
                        {row.userName}
                      </Link>
                      <span className="block text-xs text-muted-foreground">{row.userEmail}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {[row.browser, row.os].filter(Boolean).join(" · ") || "Unknown"}
                      <span className="block text-xs text-muted-foreground">{row.deviceType}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {[row.city, row.country].filter(Boolean).join(", ") || "Unknown"}
                    </TableCell>
                    <TableCell className="font-mono text-xs select-all">
                      {row.ipAddress || "Unknown"}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDateTime(row.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <RevokeAllSessionsButton userId={row.userId} label="Revoke sessions" />
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
