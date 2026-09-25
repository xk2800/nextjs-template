'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { Skeleton } from '../../ui/skeleton'
import { Checkbox } from '../../ui/checkbox'
import { DataTable, type Column } from '../../ui/data-table'
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
import Link from 'next/link'
import { formatDate, formatDateTime } from '@xk2800/nextjs-template/lib/formatters'
import { Download } from 'lucide-react'
import { authClient, useSession } from '@xk2800/nextjs-template/auth-client'

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
  const { data: currentSession } = useSession()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData | null>(initialPagination)
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'delete' | 'ban' | 'unban' | 'promote' | 'demote' | 'impersonate' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkActionType, setBulkActionType] = useState<'ban' | 'delete' | null>(null)
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  const currentUserId = currentSession?.user?.id
  const selectableIds = users.filter((u) => u.id !== currentUserId).map((u) => u.id)
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))
  const someSelected = selectedIds.size > 0 && !allSelected

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(selectableIds))
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

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
      if (!silent) setSelectedIds(new Set())
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

    if (actionType === 'impersonate') {
      setIsProcessing(true)
      try {
        const { error } = await authClient.admin.impersonateUser({ userId: actionUserId })
        if (error) throw new Error(error.message)
        setActionUserId(null)
        setActionType(null)
        router.push('/dashboard')
      } catch (error) {
        toast.error('Failed to impersonate user')
        console.error(error)
      } finally {
        setIsProcessing(false)
      }
      return
    }

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

  const handleBulkAction = async () => {
    if (!bulkActionType || selectedIds.size === 0) return

    setIsBulkProcessing(true)
    try {
      const userIds = Array.from(selectedIds)
      const response =
        bulkActionType === 'delete'
          ? await fetch('/api/admin/users/bulk-delete', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userIds }),
            })
          : await fetch('/api/admin/users/bulk-ban', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userIds, ban: true, reason: 'Banned by admin (bulk action)' }),
            })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Bulk action failed')
      }

      toast.success(
        bulkActionType === 'delete'
          ? `${userIds.length} user(s) deleted`
          : `${userIds.length} user(s) banned`
      )
      setBulkActionType(null)
      setSelectedIds(new Set())
      await fetchUsers(page, search)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to bulk ${bulkActionType} users`)
      console.error(error)
    } finally {
      setIsBulkProcessing(false)
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
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between gap-4 mb-4 rounded-md border bg-muted/50 px-4 py-2">
              <p className="text-sm font-medium">{selectedIds.size} selected</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                  Clear
                </Button>
                <Button variant="outline" size="sm" onClick={() => setBulkActionType('ban')}>
                  Ban Selected
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setBulkActionType('delete')}>
                  Delete Selected
                </Button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No users found</p>
          ) : (
            <DataTable
              columns={[
                {
                  name: 'select',
                  title: (
                    <Checkbox
                      checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all users on this page"
                    />
                  ),
                  minWidth: 40,
                  renderer: (user) => (
                    <Checkbox
                      checked={selectedIds.has(user.id)}
                      onCheckedChange={() => toggleSelectOne(user.id)}
                      disabled={user.id === currentUserId}
                      aria-label={`Select ${user.name || user.email}`}
                    />
                  ),
                },
                {
                  name: 'name',
                  title: 'Name',
                  sticky: true,
                  renderer: (user) => (
                    <Link
                      href={`/dashboard/admin/users/${user.id}`}
                      className="inline-flex items-center gap-2 font-medium hover:underline"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${isOnline(user.lastActiveAt) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        title={isOnline(user.lastActiveAt) ? 'Online' : 'Offline'}
                      />
                      {user.name || 'N/A'}
                    </Link>
                  ),
                },
                {
                  name: 'email',
                  title: 'Email',
                  renderer: (user) => <span className="text-sm">{user.email}</span>,
                },
                {
                  name: 'role',
                  title: 'Role',
                  renderer: (user) => (
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  ),
                },
                {
                  name: 'status',
                  title: 'Status',
                  renderer: (user) =>
                    user.banned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    ),
                },
                {
                  name: 'lastLoginAt',
                  title: 'Last Login',
                  renderer: (user) => (
                    <span className="text-sm">
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                    </span>
                  ),
                },
                {
                  name: 'createdAt',
                  title: 'Joined',
                  renderer: (user) => <span className="text-sm">{formatDate(user.createdAt)}</span>,
                },
                {
                  name: 'actions',
                  title: 'Actions',
                  minWidth: 340,
                  renderer: (user) => (
                    <div className="space-x-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={user.id === currentUserId || user.banned}
                        title={user.banned ? 'Cannot impersonate a banned user' : undefined}
                        onClick={() => {
                          setActionUserId(user.id)
                          setActionType('impersonate')
                        }}
                      >
                        Impersonate
                      </Button>
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
                    </div>
                  ),
                },
              ] satisfies Column<User>[]}
              data={users}
              getRowId={(user) => user.id}
            />
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
              {actionType === 'impersonate' && 'Impersonate User?'}
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
              {actionType === 'impersonate' &&
                "You'll be signed in as this user until you stop impersonating. This is logged."}
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

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog
        open={!!bulkActionType}
        onOpenChange={(open) => {
          if (!open) setBulkActionType(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkActionType === 'delete'
                ? `Delete ${selectedIds.size} Users?`
                : `Ban ${selectedIds.size} Users?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkActionType === 'delete'
                ? 'This will permanently delete the selected users and all their data. This action cannot be undone.'
                : 'This will revoke all sessions for the selected users and prevent them from logging in.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              disabled={isBulkProcessing}
              className={bulkActionType === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isBulkProcessing ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
