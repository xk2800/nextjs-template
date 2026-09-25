'use client'

import { Badge } from "../../ui/badge"
import { DataTable, type Column } from "../../ui/data-table"
import { formatDateTime, actionBadgeVariant } from "../../../lib/formatters"

export type ActivityLogRow = {
  id: string
  action: string
  description: string
  referrerUrl: string | null
  device: string
  location: string
  ipAddress: string | null
  createdAt: Date
}

const columns: Column<ActivityLogRow>[] = [
  {
    name: 'action',
    title: 'Action',
    sticky: true,
    renderer: (log) => (
      <Badge variant={actionBadgeVariant[log.action] || 'outline'}>
        {log.action.replace(/_/g, ' ')}
      </Badge>
    ),
  },
  {
    name: 'description',
    title: 'Description',
    renderer: (log) => (
      <div className="text-sm max-w-xs">
        <div className="truncate">{log.description}</div>
        {log.referrerUrl && (
          <div className="text-xs text-gray-500 truncate">via {log.referrerUrl}</div>
        )}
      </div>
    ),
  },
  {
    name: 'device',
    title: 'Device',
    renderer: (log) => <span className="text-sm">{log.device}</span>,
  },
  {
    name: 'location',
    title: 'Location',
    renderer: (log) => <span className="text-sm">{log.location}</span>,
  },
  {
    name: 'ipAddress',
    title: 'IP Address',
    renderer: (log) => <span className="text-sm font-mono">{log.ipAddress || 'N/A'}</span>,
  },
  {
    name: 'createdAt',
    title: 'Time',
    renderer: (log) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {formatDateTime(log.createdAt)}
      </span>
    ),
  },
]

export default function AdminUserActivityLogTable({ rows }: { rows: ActivityLogRow[] }) {
  return <DataTable columns={columns} data={rows} getRowId={(log) => log.id} />
}
