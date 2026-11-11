'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { Skeleton } from '../../ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { DataTable, DataTablePagination, type Column } from '../../ui/data-table'
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
import { formatDateTime } from '../../../lib/formatters'

interface Row {
  id: string
  status: 'active' | 'ended' | 'revoked'
  adminId: string
  adminName: string | null
  adminEmail: string | null
  targetId: string | null
  targetName: string | null
  targetEmail: string | null
  startedAt: string
  endedAt: string | null
  ipAddress: string | null
  userAgent: string | null
}

interface Stats { active: number; last24h: number; uniqueAdmins: number }
interface Data { sessions: Row[]; total: number; pages: number; stats: Stats }

function duration(row: Row) {
  if (!row.endedAt && row.status !== 'active') return '—'
  const ms = (row.endedAt ? new Date(row.endedAt).getTime() : Date.now()) - new Date(row.startedAt).getTime()
  const s = Math.max(0, Math.floor(ms / 1000))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`
}

function StatusBadge({ status }: { status: Row['status'] }) {
  if (status === 'active') {
    return (
      <Badge className="gap-1.5 border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        Active now
      </Badge>
    )
  }
  return status === 'revoked'
    ? <Badge variant="destructive">Revoked</Badge>
    : <Badge variant="secondary">Ended</Badge>
}

function Person({ id, name, email }: { id: string | null; name: string | null; email: string | null }) {
  if (!id || (!name && !email)) return <span className="text-sm text-muted-foreground">Deleted account</span>
  return (
    <div className="text-sm">
      <Link href={`/dashboard/admin/users/${id}`} className="font-medium hover:underline">{name || email}</Link>
      {name && <div className="text-xs text-gray-500">{email}</div>}
    </div>
  )
}

// Full impersonation history: stats, searchable/filterable table, and an
// End session action for live sessions. Data comes from /api/admin/users/impersonation.
export default function ImpersonationTab() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [ending, setEnding] = useState<Row | null>(null)
  const [busy, setBusy] = useState(false)
  const requestId = useRef(0)

  const load = useCallback(async (silent = false) => {
    const id = ++requestId.current
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/impersonation?${new URLSearchParams({ search, status, page: String(page) })}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      if (id === requestId.current) setData(json)
    } catch {
      if (!silent && id === requestId.current) toast.error('Failed to load impersonation sessions')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [search, status, page])

  // Debounced reload on filter change (also covers first load).
  useEffect(() => {
    const t = setTimeout(() => load(), 250)
    return () => clearTimeout(t)
  }, [load])

  // Keep durations and active state fresh while the tab is open.
  useEffect(() => {
    const t = setInterval(() => load(true), 15_000)
    return () => clearInterval(t)
  }, [load])

  const endSession = async () => {
    if (!ending) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/users/impersonation/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: ending.adminId, targetId: ending.targetId }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to end session')
      toast.success('Impersonation session ended')
      setEnding(null)
      load(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to end session')
    } finally {
      setBusy(false)
    }
  }

  const columns: Column<Row>[] = [
    { name: 'status', title: 'Status', sticky: true, minWidth: 130, renderer: (r) => <StatusBadge status={r.status} /> },
    { name: 'admin', title: 'Admin', minWidth: 200, renderer: (r) => <Person id={r.adminId} name={r.adminName} email={r.adminEmail} /> },
    { name: 'target', title: 'Target account', minWidth: 200, renderer: (r) => <Person id={r.targetId} name={r.targetName} email={r.targetEmail} /> },
    { name: 'startedAt', title: 'Started', renderer: (r) => <span className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(r.startedAt)}</span> },
    { name: 'duration', title: 'Duration', renderer: (r) => <span className="font-mono text-sm">{duration(r)}</span> },
    {
      name: 'ip',
      title: 'IP',
      renderer: (r) => (
        <span className="font-mono text-sm" title={r.userAgent ?? undefined}>{r.ipAddress || '—'}</span>
      ),
    },
    {
      name: 'actions',
      title: '',
      minWidth: 100,
      renderer: (r) =>
        r.status === 'active' ? (
          <Button variant="destructive" size="sm" onClick={() => setEnding(r)}>End session</Button>
        ) : null,
    },
  ]

  const stats = data?.stats
  const tiles = [
    { label: 'Active now', value: stats?.active, pulse: !!stats?.active },
    { label: 'Started in last 24h', value: stats?.last24h },
    { label: 'Unique admins', value: stats?.uniqueAdmins },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                {t.pulse && (
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                )}
                {t.label}
              </CardDescription>
              <CardTitle className="text-3xl">{t.value ?? '—'}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Impersonation audit feed</CardTitle>
            <CardDescription>
              {data ? `${data.total} impersonation session${data.total === 1 ? '' : 's'}` : 'Loading...'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search admin or target..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="max-w-xs"
            />
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status: All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="ml-auto" disabled={loading} onClick={() => load()}>
              <RefreshCw className={loading ? 'animate-spin' : undefined} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : !data || data.sessions.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No impersonation sessions found</p>
          ) : (
            <DataTable columns={columns} data={data.sessions} getRowId={(r) => r.id} pageSize={false} />
          )}
          {data && (
            <DataTablePagination page={page} pages={data.pages} onPageChange={setPage} className="mt-6 pt-6" />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!ending} onOpenChange={(o) => !o && setEnding(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End impersonation session?</AlertDialogTitle>
            <AlertDialogDescription>
              {ending?.adminEmail ?? 'The admin'} will be signed out of {ending?.targetEmail ?? 'the target account'} immediately. This is logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className="bg-destructive hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); endSession() }}
            >
              {busy ? 'Ending...' : 'End session'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
