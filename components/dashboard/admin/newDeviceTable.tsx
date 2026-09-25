'use client'

import Link from "next/link"
import { type RecentNewDeviceRow } from "@xk2800/nextjs-template/admin/queries"
import { DataTable, type Column } from "../../ui/data-table"
import { formatDateTime } from "../../../lib/formatters"
import RevokeAllSessionsButton from "./revokeAllSessionsButton"

const columns: Column<RecentNewDeviceRow>[] = [
  {
    name: 'account',
    title: 'Account',
    sticky: true,
    renderer: (row) => (
      <span className="text-sm">
        <Link href={`/dashboard/admin/users/${row.userId}`} className="font-medium hover:underline">
          {row.userName}
        </Link>
        <span className="block text-xs text-muted-foreground">{row.userEmail}</span>
      </span>
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
    name: 'ipAddress',
    title: 'IP address',
    renderer: (row) => (
      <span className="font-mono text-xs select-all">{row.ipAddress || "Unknown"}</span>
    ),
  },
  {
    name: 'createdAt',
    title: 'When',
    renderer: (row) => (
      <span className="text-xs whitespace-nowrap text-muted-foreground">
        {formatDateTime(row.createdAt)}
      </span>
    ),
  },
  {
    name: 'actions',
    title: 'Action',
    renderer: (row) => (
      <span className="block text-right">
        <RevokeAllSessionsButton userId={row.userId} label="Revoke sessions" />
      </span>
    ),
  },
]

export default function NewDeviceTable({ rows }: { rows: RecentNewDeviceRow[] }) {
  return <DataTable columns={columns} data={rows} getRowId={(row) => row.id} />
}
