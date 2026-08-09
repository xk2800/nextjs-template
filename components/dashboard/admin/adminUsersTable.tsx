'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { Skeleton } from '../../ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { formatDate, formatDateTime } from '@xk2800/nextjs-template/lib/formatters'
import { Download } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  banned: boolean
  bannedAt: Date | null
  bannedReason: string | null
  lastLoginAt: Date | null
  lastActiveAt: Date | null
  createdAt: Date
}

// A user counts as "online" if their heartbeat (sent every 30s while a
// dashboard tab is open, see components/dashboard/heartbeat.tsx) landed
// within this window.
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000

function isOnline(lastActiveAt: Date | null): boolean {
  if (!lastActiveAt) return false
  return Date.now() - new Date(lastActiveAt).getTime() < ONLINE_THRESHOLD_MS
}

interface PaginationData {
  page: number
  limit: number
  total: number
  pages: number
}

interface AdminUsersTableProps {
  initialUsers: User[]
  initialPagination: PaginationData
}

export default function AdminUsersTable({ initialUsers, initialPagination }: AdminUsersTableProps) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData | null>(initialPagination)
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'delete' | 'ban' | 'unban' | 'promote' | 'demote' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const fetchUsers = async (pageNum: number, searchQuery: string, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        search: searchQuery,
      })
      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      if (!silent) toast.error('Failed to load users')
      console.error(error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      fetchUsers(1, search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Keep online status fresh without a full-page reload.
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers(page, search, true)
    }, 30_000)
    return () => clearInterval(interval)
  }, [page, search])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams({ search })
      const response = await fetch(`/api/admin/users/export?${params}`)
      if (!response.ok) throw new Error('Failed to export users')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to export users')
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleAction = async () => {
    if (!actionUserId || !actionType) return

    setIsProcessing(true)
    try {
      let response
      let successMessage = ''

      switch (actionType) {
        case 'delete':
          response = await fetch(`/api/admin/users/${actionUserId}`, {
            method: 'DELETE',
          })
          successMessage = 'User deleted successfully'
          break
        case 'ban':
          response = await fetch(`/api/admin/users/${actionUserId}/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ban: true, reason: 'Banned by admin' }),
          })
          successMessage = 'User banned successfully'
          break
        case 'unban':
          response = await fetch(`/api/admin/users/${actionUserId}/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ban: false }),
          })
          successMessage = 'User unbanned successfully'
          break
        case 'promote':
          response = await fetch(`/api/admin/users/${actionUserId}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'admin' }),
          })
          successMessage = 'User promoted to admin'
          break
        case 'demote':
          response = await fetch(`/api/admin/users/${actionUserId}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'user' }),
          })
          successMessage = 'Admin access removed'
          break
      }

      if (!response?.ok) throw new Error('Action failed')
      toast.success(successMessage)
      setActionUserId(null)
      setActionType(null)
      await fetchUsers(page, search)
    } catch (error) {
      toast.error(`Failed to ${actionType} user`)
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Search by name or email</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Users List</CardTitle>
            <CardDescription>
              {pagination ? `Showing ${users.length} of ${pagination.total} users` : 'Loading...'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || users.length === 0}
          >
            <Download />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${isOnline(user.lastActiveAt) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                            title={isOnline(user.lastActiveAt) ? 'Online' : 'Offline'}
                          />
                          {user.name || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.banned ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {user.role === 'admin' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActionUserId(user.id)
                              setActionType('demote')
                            }}
                          >
                            Remove Admin
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActionUserId(user.id)
                              setActionType('promote')
                            }}
                          >
                            Make Admin
                          </Button>
                        )}
                        {user.banned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActionUserId(user.id)
                              setActionType('unban')
                            }}
                          >
                            Unban
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActionUserId(user.id)
                              setActionType('ban')
                            }}
                          >
                            Ban
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setActionUserId(user.id)
                            setActionType('delete')
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
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
                    fetchUsers(page - 1, search)
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
                    fetchUsers(page + 1, search)
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

      {/* Action Confirmation Dialog */}
      <AlertDialog open={!!actionUserId} onOpenChange={() => setActionUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'delete' && 'Delete User?'}
              {actionType === 'ban' && 'Ban User?'}
              {actionType === 'unban' && 'Unban User?'}
              {actionType === 'promote' && 'Promote to Admin?'}
              {actionType === 'demote' && 'Remove Admin Access?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'delete' &&
                'This action will permanently delete the user and all their data.'}
              {actionType === 'ban' &&
                'This will revoke all sessions and prevent the user from logging in.'}
              {actionType === 'unban' && 'This will restore the user access.'}
              {actionType === 'promote' &&
                'This will grant the user full admin dashboard access.'}
              {actionType === 'demote' &&
                "This will revoke the user's admin dashboard access."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isProcessing}
              className={actionType === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isProcessing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
