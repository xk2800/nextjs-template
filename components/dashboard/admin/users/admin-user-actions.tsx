'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '../../../ui/button'
import { Input } from '../../../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../ui/alert-dialog'
import { authClient } from '../../../../lib/auth/client'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator } from '../../../ui/dropdown-menu'
import RevokeAllSessionsButton from './revoke-all-sessions'

type Target = { id: string; email: string; role: string; banned: boolean }

async function call(url: string, init: RequestInit, fallback: string) {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || fallback)
}

// Button + confirmation dialog. `children` lets the dialog carry extra input (ban reason).
function Confirm({
  label, title, description, confirmLabel = 'Confirm', variant = 'outline', onConfirm, children,
}: {
  label: string
  title: string
  description: string
  confirmLabel?: string
  variant?: 'outline' | 'destructive'
  onConfirm: () => Promise<void>
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)}>{label}</Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          {children}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className={variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : ''}
              onClick={async (e) => {
                e.preventDefault()
                setBusy(true)
                try {
                  await onConfirm()
                  setOpen(false)
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Action failed')
                } finally {
                  setBusy(false)
                }
              }}
            >
              {busy ? 'Processing...' : confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

const EXPORT_SECTIONS = [
  ['profile', 'Profile'],
  ['security', 'Security'],
  ['logins', 'Registration & Login Info'],
  ['devices', 'Devices'],
  ['consent', 'Consent'],
  ['activity', 'Activity Log'],
] as const

// Pick which sections go into the profile CSV, then download it.
function ExportMenu({ userId }: { userId: string }) {
  const [picked, setPicked] = useState<string[]>(EXPORT_SECTIONS.map(([k]) => k))
  const toggle = (k: string, on: boolean) => setPicked((p) => (on ? [...p, k] : p.filter((x) => x !== k)))
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">Export CSV</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {EXPORT_SECTIONS.map(([key, label]) => (
          <DropdownMenuCheckboxItem
            key={key}
            checked={picked.includes(key)}
            onCheckedChange={(on) => toggle(key, on)}
            onSelect={(e) => e.preventDefault()}
          >
            {label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <div className="p-1">
          <Button size="sm" className="w-full" disabled={picked.length === 0} asChild={picked.length > 0}>
            {picked.length > 0 ? (
              <a href={`/api/admin/users/${userId}/export?sections=${picked.join(',')}`} download>Download</a>
            ) : 'Download'}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Page-header toolbar: impersonate, role, password reset email, delete.
export function AdminUserHeaderActions({ user, isSelf }: { user: Target; isSelf: boolean }) {
  const router = useRouter()

  const changeRole = async (role: string) => {
    try {
      await call(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      }, 'Failed to update role')
      toast.success(`Role changed to ${role}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={user.role} onValueChange={changeRole} disabled={isSelf}>
        <SelectTrigger className="h-8 w-[110px]" aria-label="Role"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="tester">Tester</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>

      <ExportMenu userId={user.id} />

      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          const { error } = await authClient.requestPasswordReset({ email: user.email, redirectTo: '/reset-password' })
          if (error) toast.error(error.message || 'Could not send reset email')
          else toast.success(`Password reset email sent to ${user.email}`)
        }}
      >
        Send password reset
      </Button>

      {!isSelf && !user.banned && (
        <Confirm
          label="Impersonate"
          title="Impersonate User?"
          description="You'll be signed in as this user until you stop impersonating. This is logged."
          onConfirm={async () => {
            const { error } = await authClient.admin.impersonateUser({ userId: user.id })
            if (error) throw new Error(error.message || 'Failed to impersonate user')
            router.push('/dashboard')
          }}
        />
      )}

      {!isSelf && (
        <Confirm
          label="Delete"
          variant="destructive"
          title="Delete User?"
          description="This action will permanently delete the user and all their data."
          onConfirm={async () => {
            await call(`/api/admin/users/${user.id}`, { method: 'DELETE' }, 'Failed to delete user')
            toast.success('User deleted')
            router.push('/dashboard/admin/users')
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

// Sidebar danger zone: ban / unban and revoke every session.
export function AdminUserDangerZone({ user, isSelf }: { user: Target; isSelf: boolean }) {
  const router = useRouter()
  const [reason, setReason] = useState('')

  const setBan = async (ban: boolean) => {
    await call(`/api/admin/users/${user.id}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ban ? { ban, reason: reason.trim() || 'Banned by admin' } : { ban }),
    }, `Failed to ${ban ? 'ban' : 'unban'} user`)
    toast.success(ban ? 'User banned' : 'User unbanned')
    setReason('')
    router.refresh()
  }

  if (isSelf) return <p className="text-sm text-muted-foreground">You can&apos;t use these actions on your own account.</p>

  return (
    <div className="flex flex-wrap gap-2">
      {user.banned ? (
        <Confirm label="Unban account" title="Unban User?" description="This will restore the user's access." onConfirm={() => setBan(false)} />
      ) : (
        <Confirm
          label="Ban account"
          title="Ban User?"
          description="This will revoke all sessions and prevent the user from logging in."
          variant="destructive"
          onConfirm={() => setBan(true)}
        >
          <Input
            placeholder="Reason (optional, shown to the user)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
          />
        </Confirm>
      )}
      <RevokeAllSessionsButton userId={user.id} variant="outline" />
    </div>
  )
}
