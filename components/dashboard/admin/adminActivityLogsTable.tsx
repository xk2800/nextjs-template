'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { Switch } from '../../ui/switch'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { DatePickerWithPresets } from '../../ui/date-picker-with-presets'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../ui/sheet'
import AuditSeverityBadge, { SeverityLegend } from './auditSeverityBadge'
import { CATEGORY_LABELS, SEVERITY_LABELS, categoryOf } from '../../../lib/activity-severity'
import { format, subDays } from 'date-fns'
import { Skeleton } from '../../ui/skeleton'
import { DataTable, DataTablePagination, type Column } from '../../ui/data-table'
import { toast } from 'sonner'
import { formatDateTime } from '@xk2800/nextjs-template/lib/formatters'
import { Download } from 'lucide-react'

interface ActivityLog {
  id: string
  action: string
  description: string
  ipAddress: string | null
  userAgent: string | null
  metadata: string | null
  createdAt: Date | string
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

const toYmd = (d: Date) => format(d, 'yyyy-MM-dd')

const RANGE_PRESETS = [
  { value: 'any', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom range' },
]

function parseMetadata(raw: string | null) {
  if (!raw) return null
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

interface AdminActivityLogsTableProps {
  initialLogs: ActivityLog[]
  initialPagination: PaginationData
}

const makeColumns = (onView: (log: ActivityLog) => void): Column<ActivityLog>[] => [
  {
    name: 'severity',
    title: 'Severity',
    sticky: true,
    minWidth: 100,
    renderer: (log) => <AuditSeverityBadge action={log.action} />,
  },
  {
    name: 'createdAt',
    title: 'Time',
    priority: 0,
    renderer: (log) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(log.createdAt)}</span>
    ),
  },
  {
    name: 'user',
    title: 'Actor',
    priority: -1,
    minWidth: 240,
    renderer: (log) => (
      <div className="text-sm">
        <div className="font-medium">{log.userName || 'N/A'}</div>
        <div className="text-xs text-gray-500">{log.userEmail}</div>
      </div>
    ),
  },
  {
    name: 'action',
    title: 'Event',
    minWidth: 160,
    renderer: (log) => (
      <div className="text-sm">
        <div className="font-medium capitalize">{log.action.replace(/_/g, ' ')}</div>
        <div className="max-w-xs truncate text-xs text-gray-500">{log.description}</div>
      </div>
    ),
  },
  {
    name: 'ipAddress',
    title: 'IP Address',
    renderer: (log) => <span className="text-sm font-mono">{log.ipAddress || 'N/A'}</span>,
  },
  {
    name: 'details',
    title: '',
    minWidth: 80,
    renderer: (log) => (
      <Button variant="ghost" size="sm" onClick={() => onView(log)}>View</Button>
    ),
  },
]

export default function AdminActivityLogsTable({ initialLogs, initialPagination }: AdminActivityLogsTableProps) {
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [range, setRange] = useState('any')
  const [live, setLive] = useState(false)
  const [selected, setSelected] = useState<ActivityLog | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationData | null>(initialPagination)
  const [isExporting, setIsExporting] = useState(false)

  const requestId = useRef(0)

  const filterParams = () => ({
    search,
    ...(category !== 'all' && { category }),
    ...(severity !== 'all' && { severity }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
  })

  const applyRange = (value: string) => {
    setRange(value)
    const today = new Date()
    if (value === 'today') { setDateFrom(toYmd(today)); setDateTo(toYmd(today)) }
    else if (value === '7d') { setDateFrom(toYmd(subDays(today, 6))); setDateTo(toYmd(today)) }
    else if (value === '30d') { setDateFrom(toYmd(subDays(today, 29))); setDateTo(toYmd(today)) }
    else if (value === 'any') { setDateFrom(''); setDateTo('') }
  }

  const fetchLogs = async (pageNum: number, silent = false) => {
    const currentRequest = ++requestId.current
    if (!silent) setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...filterParams(),
      })
      const response = await fetch(`/api/admin/activity-logs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch activity logs')
      const data = await response.json()
      if (currentRequest !== requestId.current) return
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch (error) {
      if (currentRequest !== requestId.current) return
      if (!silent) toast.error('Failed to load activity logs')
      console.error(error)
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
    }
  }

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      fetchLogs(1)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, severity, dateFrom, dateTo])

  // Live feed: quiet refetch of the current page every 10s.
  useEffect(() => {
    if (!live) return
    const t = setInterval(() => fetchLogs(page, true), 10_000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, page, search, category, severity, dateFrom, dateTo])

  const resetFilters = () => {
    setSearch('')
    setCategory('all')
    setSeverity('all')
    setRange('any')
    setDateFrom('')
    setDateTo('')
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams(filterParams())
      const response = await fetch(`/api/admin/activity-logs/export?${params}`)
      if (!response.ok) throw new Error('Failed to export activity logs')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to export activity logs')
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  const hasFilters = !!(search || category !== 'all' || severity !== 'all' || dateFrom || dateTo)
  const columns = makeColumns(setSelected)
  const metadata = selected ? parseMetadata(selected.metadata) : null

  return (
    <>
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Activity Events</CardTitle>
              <CardDescription>
                {pagination ? `Showing ${logs.length} of ${pagination.total} events` : 'Loading...'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="live-feed" checked={live} onCheckedChange={setLive} />
                <Label htmlFor="live-feed" className="text-sm">Live feed</Label>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting || logs.length === 0}>
                <Download />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search user or IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Category: All</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Severity: All</SelectItem>
                {Object.entries(SEVERITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <SeverityLegend />
            <Select value={range} onValueChange={applyRange}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RANGE_PRESETS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {range === 'custom' && (
              <>
                <DatePickerWithPresets
                  placeholder="From"
                  date={dateFrom ? new Date(`${dateFrom}T00:00:00`) : undefined}
                  onDateChange={(d) => setDateFrom(d ? toYmd(d) : '')}
                  disableFutureDates
                />
                <DatePickerWithPresets
                  placeholder="To"
                  date={dateTo ? new Date(`${dateTo}T00:00:00`) : undefined}
                  onDateChange={(d) => setDateTo(d ? toYmd(d) : '')}
                  disableFutureDates
                />
              </>
            )}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>Clear</Button>
            )}
          </div>
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
            <DataTable columns={columns} data={logs} getRowId={(log) => log.id} pageSize={false} />
          )}

          {pagination && (
            <DataTablePagination
              page={page}
              pages={pagination.pages}
              onPageChange={(p) => {
                setPage(p)
                fetchLogs(p)
              }}
              className="mt-6 pt-6"
            />
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="capitalize">{selected.action.replace(/_/g, ' ')}</SheetTitle>
                <SheetDescription>{selected.description}</SheetDescription>
              </SheetHeader>
              <dl className="space-y-4 px-4 pb-4 text-sm">
                <div className="flex items-center gap-2">
                  <AuditSeverityBadge action={selected.action} />
                  <Badge variant="outline">{CATEGORY_LABELS[categoryOf(selected.action)]}</Badge>
                </div>
                {([
                  ['Time', formatDateTime(selected.createdAt)],
                  ['Actor', `${selected.userName || 'N/A'} (${selected.userEmail || selected.userId})`],
                  ['IP address', selected.ipAddress || 'N/A'],
                  ['User agent', selected.userAgent || 'N/A'],
                  ['Event ID', selected.id],
                ] as const).map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-medium text-gray-600">{k}</dt>
                    <dd className="break-all">{v}</dd>
                  </div>
                ))}
                {metadata && (
                  <div>
                    <dt className="font-medium text-gray-600">Metadata</dt>
                    <dd>
                      <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-xs">{metadata}</pre>
                    </dd>
                  </div>
                )}
              </dl>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
