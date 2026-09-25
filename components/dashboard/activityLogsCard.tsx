'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import { DataTable, type Column } from '../ui/data-table'
import { formatDateTime, actionBadgeVariant } from '../../lib/formatters'

interface ActivityLog {
  id: string
  action: string
  description: string
  ipAddress: string | null
  userAgent: string | null
  deviceLabel?: string
  location?: string
  createdAt: Date | string
  userId: string
  userName?: string | null
  userEmail?: string | null
}

interface ActivityLogsCardProps {
  isAdmin?: boolean
  initialLogs?: ActivityLog[]
}

const baseColumns: Column<ActivityLog>[] = [
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
    renderer: (log) => <span className="text-sm max-w-xs truncate block">{log.description}</span>,
  },
  {
    name: 'deviceLabel',
    title: 'Device',
    renderer: (log) => <span className="text-sm">{log.deviceLabel || 'N/A'}</span>,
  },
  {
    name: 'location',
    title: 'Location',
    renderer: (log) => <span className="text-sm">{log.location || 'N/A'}</span>,
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

const userColumn: Column<ActivityLog> = {
  name: 'user',
  title: 'User',
  renderer: (log) => (
    <div className="text-sm">
      <div className="font-medium">{log.userName || 'N/A'}</div>
      <div className="text-xs text-gray-500">{log.userEmail}</div>
    </div>
  ),
}

export default function ActivityLogsCard({ isAdmin = false, initialLogs = [] }: ActivityLogsCardProps) {
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const params = new URLSearchParams({
          limit: '20',
          offset: '0',
        })
        const response = await fetch(`/api/activity-logs?${params}`)
        if (!response.ok) throw new Error('Failed to fetch logs')
        const data = await response.json()
        setLogs(data.logs)
      } catch (error) {
        console.error('Failed to fetch activity logs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
    // Refresh logs every 30 seconds
    const interval = setInterval(fetchLogs, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Logs</CardTitle>
        <CardDescription>
          {isAdmin ? 'Recent activity from all users' : 'Your recent activity'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No activity logs found</p>
        ) : (
          <DataTable
            columns={
              isAdmin
                ? [baseColumns[0], userColumn, ...baseColumns.slice(1)]
                : baseColumns
            }
            data={logs}
            getRowId={(log) => log.id}
          />
        )}
      </CardContent>
    </Card>
  )
}
