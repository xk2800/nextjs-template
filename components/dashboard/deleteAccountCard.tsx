'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { PasswordInput } from '../ui/password-input'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { authClient, useSession } from '../../lib/auth-client'

export default function DeleteAccountCard() {
  const { data: session } = useSession()
  const email = session?.user.email ?? ''
  // null = still checking. Credential users confirm with their password;
  // OAuth-only users have none, so they type their email instead and the
  // server requires a recent sign-in (better-auth's freshAge check).
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [typedEmail, setTypedEmail] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    authClient.listAccounts().then(({ data }) => {
      setHasPassword(!!data?.some((a) => a.providerId === 'credential'))
    })
  }, [])

  const canSubmit = hasPassword ? password.length > 0 : typedEmail.trim().toLowerCase() === email.toLowerCase()

  const close = (next: boolean) => {
    if (deleting) return
    setOpen(next)
    if (!next) {
      setPassword('')
      setTypedEmail('')
    }
  }

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setDeleting(true)
    try {
      const { error } = await authClient.deleteUser(hasPassword ? { password } : {})
      if (error) {
        toast.error(
          error.code === 'SESSION_EXPIRED'
            ? 'For your security, sign out and sign back in, then try again.'
            : error.message || 'Could not delete account',
        )
        return
      }
      // Full reload, not router.push: drops every cached session/client state.
      window.location.href = '/'
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            Permanently delete your account, sessions, passkeys, and activity
            history. This can&apos;t be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setOpen(true)} disabled={hasPassword === null}>
            Delete account
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={open} onOpenChange={close}>
        <AlertDialogContent>
          <form onSubmit={deleteAccount} className="space-y-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                Everything tied to <strong>{email}</strong> is removed immediately
                and you&apos;ll be signed out on every device.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {hasPassword ? (
              <div className="flex flex-col gap-1">
                <label htmlFor="delete-password" className="text-sm font-medium">
                  Enter your password to confirm
                </label>
                <PasswordInput
                  id="delete-password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label htmlFor="delete-email" className="text-sm font-medium">
                  Type <strong>{email}</strong> to confirm
                </label>
                <Input
                  id="delete-email"
                  autoComplete="off"
                  value={typedEmail}
                  onChange={(e) => setTypedEmail(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={deleting}>Cancel</AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={!canSubmit || deleting}>
                {deleting ? 'Deleting...' : 'Delete account'}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
