'use client'

import Link from "next/link"
import { type SharedDeviceRow } from "@xk2800/nextjs-template/admin/queries"
import { Badge } from "../../ui/badge"
import { DataTable, type Column } from "../../ui/data-table"
import { formatDateTime } from "../../../lib/formatters"

const columns: Column<SharedDeviceRow>[] = [
  {
    name: 'visitorId',
    title: 'Device fingerprint',
    sticky: true,
    renderer: (d) => (
      <span className="font-mono text-xs select-all break-all">{d.visitorId}</span>
    ),
  },
  {
    name: 'device',
    title: 'Device',
    renderer: (d) => (
      <span className="text-sm">
        {[d.browser, d.os].filter(Boolean).join(" · ") || "Unknown"}
        <span className="block text-xs text-muted-foreground">{d.deviceType}</span>
      </span>
    ),
  },
  {
    name: 'location',
    title: 'Location',
    renderer: (d) => (
      <span className="text-sm">{[d.city, d.country].filter(Boolean).join(", ") || "Unknown"}</span>
    ),
  },
  {
    name: 'accountCount',
    title: 'Accounts',
    renderer: (d) => (
      <span className="block text-right font-medium tabular-nums">{d.accountCount}</span>
    ),
  },
  {
    name: 'accounts',
    title: 'Shared by',
    minWidth: 220,
    renderer: (d) => (
      <ul className="space-y-1 text-sm">
        {d.accounts.map((a) => (
          <li key={a.userId}>
            <Link href={`/dashboard/admin/users/${a.userId}`} className="font-medium hover:underline">
              {a.userName}
            </Link>
            {a.banned && <Badge variant="outline" className="ml-2">Banned</Badge>}
            <span className="block text-xs text-muted-foreground">
              {a.userEmail} · first seen {formatDateTime(a.firstSeenAt)}
            </span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    name: 'lastSeenAt',
    title: 'Last seen',
    renderer: (d) => (
      <span className="text-xs whitespace-nowrap text-muted-foreground">
        {formatDateTime(d.lastSeenAt)}
      </span>
    ),
  },
]

export default function SharedDeviceTable({ devices }: { devices: SharedDeviceRow[] }) {
  return <DataTable columns={columns} data={devices} getRowId={(d) => d.visitorId} />
}
