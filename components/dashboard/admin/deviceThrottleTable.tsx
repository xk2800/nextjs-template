'use client'

import { type DeviceThrottleRow } from "@xk2800/nextjs-template/admin/queries"
import { Badge } from "../../ui/badge"
import { DataTable, type Column } from "../../ui/data-table"
import { formatDateTime } from "../../../lib/formatters"

function statusBadge(row: DeviceThrottleRow) {
  if (row.blocked && row.windowActive) return <Badge variant="destructive">Blocked</Badge>
  if (row.windowActive) return <Badge variant="secondary">Watching</Badge>
  return <Badge variant="outline">Cooled off</Badge>
}

const columns: Column<DeviceThrottleRow>[] = [
  { name: 'status', title: 'Status', sticky: true, renderer: (row) => statusBadge(row) },
  {
    name: 'fingerprint',
    title: 'Fingerprint',
    minWidth: 180,
    renderer: (row) => (
      <span className="font-mono text-xs select-all whitespace-nowrap">{row.fingerprint}</span>
    ),
  },
  {
    name: 'ipAddress',
    title: 'IP address',
    renderer: (row) => (
      <span className="font-mono text-xs select-all">{row.ipAddress || "Unknown"}</span>
    ),
  },
  {
    name: 'device',
    title: 'Device',
    renderer: (row) => (
      <span className="text-sm">
        {[row.browser, row.os].filter(Boolean).join(" · ") || "Unknown"}
        <span className="block text-xs text-muted-foreground">{row.deviceType}</span>
      </span>
    ),
  },
  {
    name: 'location',
    title: 'Location',
    renderer: (row) => (
      <span className="text-sm">
        {[row.city, row.country].filter(Boolean).join(", ") || "Unknown"}
      </span>
    ),
  },
  {
    name: 'count',
    title: 'Attempts',
    renderer: (row) => (
      <span className="block text-right font-medium tabular-nums">{row.count}</span>
    ),
  },
  {
    name: 'lastKind',
    title: 'Kind',
    renderer: (row) => (
      <span className="text-xs text-muted-foreground">
        {row.lastKind === "signup" ? "sign-up" : "sign-in"}
      </span>
    ),
  },
  {
    name: 'lastEmail',
    title: 'Target email',
    renderer: (row) => <span className="text-sm select-all">{row.lastEmail || "—"}</span>,
  },
  {
    name: 'windowStart',
    title: 'Window started',
    renderer: (row) => (
      <span className="text-xs whitespace-nowrap text-muted-foreground">
        {formatDateTime(row.windowStart)}
      </span>
    ),
  },
  {
    name: 'lastAttemptAt',
    title: 'Last attempt',
    renderer: (row) => (
      <span className="text-xs whitespace-nowrap text-muted-foreground">
        {formatDateTime(row.lastAttemptAt)}
      </span>
    ),
  },
]

export default function DeviceThrottleTable({ rows }: { rows: DeviceThrottleRow[] }) {
  return <DataTable columns={columns} data={rows} getRowId={(row) => row.fingerprint} />
}
