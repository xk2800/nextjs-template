'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/formatters'

interface ActivityLog {
  id: string
  action: string
  description: string
  ipAddress: string | null
  userAgent: string | null
  metadata: string | null
  createdAt: string
  userId: string
  userName: string | null
  userEmail: string | null
}

interface PaginationData {
  page: number
  limit: number
  total: number
  pages: number
}

const actionOptions = [
  { value: '', label: 'All actions' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'login_failed', label: 'Login failed' },
  { value: 'password_changed', label: 'Password changed' },
  { value: 'email_changed', label: 'Email changed' },
  { value: 'profile_updated', label: 'Profile updated' },
  { value: 'session_revoked', label: 'Session revoked' },
  { value: 'user_deleted', label: 'User deleted' },
  { value: 'user_banned', label: 'User banned' },
  { value: 'user_unbanned', label: 'User unbanned' },
  { value: 'role_changed', label: 'Role changed' },
]

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

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData | null>(null)

  const fetchLogs = async (pageNum: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        search,
        action,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      })
      const response = await fetch(`/api/admin/activity-logs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch activity logs')
      const data = await response.json()
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch (error) {
      toast.error('Failed to load activity logs')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(1)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, action, dateFrom, dateTo])

  const resetFilters = () => {
    setSearch('')
    setAction('')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Review activity across all users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and narrow down activity events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="search">User</Label>
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <select
                id="action"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"
              >
                {actionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {(search || action || dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="mt-4" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>
            {pagination ? `Showing ${logs.length} of ${pagination.total} events` : 'Loading...'}
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
                    <TableHead>User</TableHead>
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
                      <TableCell className="text-sm">
                        <div className="font-medium">{log.userName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{log.userEmail}</div>
                      </TableCell>
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

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPage(page - 1)
                    fetchLogs(page - 1)
                  }}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPage(page + 1)
                    fetchLogs(page + 1)
                  }}
                  disabled={page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
