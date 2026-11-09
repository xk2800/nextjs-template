'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Skeleton } from '../ui/skeleton'
import { DataTable, type Column } from '../ui/data-table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { formatDateTime } from '../../lib/formatters'
import { authClient } from '../../lib/auth-client'

type Passkey = {
  id: string
  name?: string | null
  deviceType?: string | null
  createdAt?: Date | string | null
}

const columns: Column<Passkey>[] = [
  { name: 'name', title: 'Name', sticky: true, renderer: (pk) => pk.name || 'Passkey' },
  {
    name: 'deviceType',
    title: 'Type',
    renderer: (pk) => (
      <span className="text-sm text-muted-foreground">{pk.deviceType || '—'}</span>
    ),
  },
  {
    name: 'createdAt',
    title: 'Added',
    renderer: (pk) => (
      <span className="text-sm">{pk.createdAt ? formatDateTime(pk.createdAt) : '—'}</span>
    ),
  },
]

export default function PasskeysCard() {
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null)
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)
  const [toDelete, setToDelete] = useState<Passkey | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await authClient.passkey.listUserPasskeys()
    if (error) {
      toast.error(error.message || 'Could not load passkeys')
      setPasskeys([])
      return
    }
    setPasskeys((data ?? []) as Passkey[])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const addPasskey = async () => {
    setAdding(true)
    try {
      const res = await authClient.passkey.addPasskey({ name: name.trim() || undefined })
      if (res?.error) {
        toast.error(res.error.message || 'Could not register passkey')
        return
      }
      toast.success('Passkey registered')
      setName('')
      await load()
    } catch (err) {
      // User cancelled the browser prompt, or no authenticator available.
      toast.error(err instanceof Error ? err.message : 'Passkey registration cancelled')
    } finally {
      setAdding(false)
    }
  }

  const deletePasskey = async (id: string) => {
    setDeleting(true)
    try {
      const { error } = await authClient.passkey.deletePasskey({ id })
      if (error) {
        toast.error(error.message || 'Could not remove passkey')
        return
      }
      toast.success('Passkey removed')
      setToDelete(null)
      await load()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Passkeys</CardTitle>
          <CardDescription>
            Sign in without a password using Touch ID, Windows Hello, or a
            hardware security key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="passkey-name" className="text-sm font-medium">
                Name (optional)
              </label>
              <Input
                id="passkey-name"
                placeholder="e.g. MacBook Touch ID"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-64 max-w-full"
              />
            </div>
            <Button onClick={addPasskey} disabled={adding}>
              {adding ? 'Waiting for device...' : 'Add a passkey'}
            </Button>
          </div>

          {passkeys === null ? (
            <Skeleton className="h-20 w-full" />
          ) : passkeys.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No passkeys registered yet.
            </p>
          ) : (
            <DataTable
              columns={[
                ...columns,
                {
                  name: 'actions',
                  title: 'Actions',
                  renderer: (pk) => (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setToDelete(pk)}
                    >
                      Remove
                    </Button>
                  ),
                },
              ]}
              data={passkeys}
              getRowId={(pk) => pk.id}
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this passkey?</AlertDialogTitle>
            <AlertDialogDescription>
              You won&apos;t be able to sign in with{' '}
              {toDelete?.name ? `"${toDelete.name}"` : 'this passkey'} anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deletePasskey(toDelete.id)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
