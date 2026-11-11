'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ShieldAlert, ShieldCheck, UserCheck } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible'
import { Badge } from '../../ui/badge'
import { formatDateTime } from '../../../lib/formatters'

export interface HighlightImpersonation {
  id: string
  status: 'active' | 'ended' | 'revoked'
  adminLabel: string
  targetLabel: string
  startedAt: Date | string
}

export interface HighlightThrottle {
  fingerprint: string
  ipAddress: string | null
  count: number
  blocked: boolean
}

interface Props {
  activeImpersonations: number
  recentImpersonations: HighlightImpersonation[]
  blockedNow: number
  throttled: HighlightThrottle[]
}

const STORAGE_KEY = 'admin:security-highlights-open'

// Collapsed header carries the status at a glance; the body is two borderless
// panels (recent impersonation, device throttling). Open state is remembered
// per browser.
export default function SecurityHighlightsCollapsible({ activeImpersonations, recentImpersonations, blockedNow, throttled }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') setOpen(true)
    } catch { /* storage blocked: stay collapsed */ }
  }, [])

  const toggle = (next: boolean) => {
    setOpen(next)
    try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0') } catch { /* ignore */ }
  }

  return (
    <Collapsible open={open} onOpenChange={toggle} className="w-full rounded-lg border bg-card text-card-foreground shadow-sm">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-lg p-4 text-left hover:bg-muted/50">
        <div className="flex items-center gap-3">
          <ChevronRight className={`size-4 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
          <span className="text-sm font-semibold">Security highlights</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">Impersonation and abuse monitoring</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {activeImpersonations > 0 && (
            <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <UserCheck className="size-3" />
              {activeImpersonations} active impersonation{activeImpersonations > 1 ? 's' : ''}
            </Badge>
          )}
          {blockedNow > 0 ? (
            <Badge variant="destructive" className="gap-1">
              <ShieldAlert className="size-3" />
              {blockedNow} blocked now
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-3" />
              Limits nominal
            </Badge>
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-md bg-muted/40 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent impersonation</h4>
            {recentImpersonations.length === 0 ? (
              <p className="py-1 text-sm text-muted-foreground">No impersonation activity recorded.</p>
            ) : (
              <ul className="divide-y divide-border/40 text-sm">
                {recentImpersonations.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="flex items-center gap-2 truncate">
                      {i.status === 'active' && <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" aria-label="Active" />}
                      {i.adminLabel} &rarr; {i.targetLabel}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(i.startedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/dashboard/admin/users?tab=impersonation" className="inline-block pt-1 text-sm font-medium hover:underline">
              View all impersonation logs &rarr;
            </Link>
          </div>

          <div className="space-y-2 rounded-md bg-muted/40 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Device throttling</h4>
            {throttled.length === 0 ? (
              <p className="flex items-center gap-2 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-4" />
                All security limits nominal. No abuse activity detected.
              </p>
            ) : (
              <ul className="divide-y divide-border/40 text-sm">
                {throttled.map((t) => (
                  <li key={t.fingerprint} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="truncate font-mono text-xs">{t.ipAddress || 'Unknown IP'} · {t.fingerprint.slice(0, 8)}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted-foreground">{t.count} attempts</span>
                      {t.blocked && <Badge variant="destructive">Blocked</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
