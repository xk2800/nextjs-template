'use client'

import { Badge } from "../../ui/badge"
import { DataTable, type Column } from "../../ui/data-table"
import { formatDateTime } from "../../../lib/formatters"

export type LoginInfoRow = {
  id: string
  isRegistration: boolean
  device: string
  location: string
  referrerUrl: string | null
  ipAddress: string | null
  createdAt: Date
}

const columns: Column<LoginInfoRow>[] = [
  {
    name: 'event',
    title: 'Event',
    sticky: true,
    renderer: (login) => (
      <Badge variant={login.isRegistration ? 'default' : 'outline'}>
        {login.isRegistration ? 'Registered' : 'Login'}
      </Badge>
    ),
  },
  {
    name: 'device',
    title: 'Device',
    renderer: (login) => <span className="text-sm">{login.device}</span>,
  },
  {
    name: 'location',
    title: 'Location',
    renderer: (login) => <span className="text-sm">{login.location}</span>,
  },
  {
    name: 'referrerUrl',
    title: 'Landing URL',
    renderer: (login) => (
      <span className="text-sm max-w-xs truncate block">{login.referrerUrl || 'N/A'}</span>
    ),
  },
  {
    name: 'ipAddress',
    title: 'IP Address',
    renderer: (login) => <span className="text-sm font-mono">{login.ipAddress || 'N/A'}</span>,
  },
  {
    name: 'createdAt',
    title: 'Time',
    renderer: (login) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {formatDateTime(login.createdAt)}
      </span>
    ),
  },
]

export default function AdminUserLoginInfoTable({ rows }: { rows: LoginInfoRow[] }) {
  return <DataTable columns={columns} data={rows} getRowId={(login) => login.id} />
}
