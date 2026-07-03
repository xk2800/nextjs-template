'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { formatDateTime } from '../../lib/formatters'

interface ActivityLog {
  id: string
  action: string
  description: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  userId: string
  userName?: string | null
  userEmail?: string | null
}

const actionBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  login: 'default',
  logout: 'secondary',
  login_failed: 'destructive',
  password_changed: 'default',
  email_changed: 'default',
  profile_updated: 'secondary',
  session_revoked: 'destructive',
  user_deleted: 'destructive',
  user_banned: 'destructive',
  user_unbanned: 'default',
  role_changed: 'default',
}

interface ActivityLogsCardProps {
  isAdmin?: boolean
}

export default function ActivityLogsCard({ isAdmin = false }: ActivityLogsCardProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  {isAdmin && <TableHead>User</TableHead>}
                  <TableHead>Description</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant={actionBadgeVariant[log.action] || 'outline'}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-sm">
                        <div className="font-medium">{log.userName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{log.userEmail}</div>
                      </TableCell>
                    )}
                    <TableCell className="text-sm max-w-xs truncate">
                      {log.description}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {log.ipAddress || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDateTime(log.createdAt)}
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
