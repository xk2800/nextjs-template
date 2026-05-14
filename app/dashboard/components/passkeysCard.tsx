'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatDate } from '@/lib/formatters'
import { authClient } from '@/lib/auth-client'
import { toast } from 'sonner'
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react'

interface Passkey {
  id: string
  name: string | null
  deviceType: string
  backedUp: boolean
  createdAt: Date | null
}

export default function PasskeysCard() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addName, setAddName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const [editingPasskey, setEditingPasskey] = useState<Passkey | null>(null)
  const [editName, setEditName] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Extracted so it can be called after mutations without duplicating the fetch logic
  const loadPasskeys = async () => {
    const { data, error } = await authClient.passkey.listUserPasskeys()
    if (!error && data) {
      // Cast needed because the SDK returns a wider type than our local interface
      setPasskeys(data as Passkey[])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadPasskeys()
  }, [])

  const handleAdd = async () => {
    setIsAdding(true)
    try {
      const { error } = await authClient.passkey.addPasskey({
        // Passing undefined (not empty string) lets Better Auth omit the name field entirely
        name: addName.trim() || undefined,
      })
      if (error) {
        toast.error(error.message || 'Failed to add passkey')
      } else {
        toast.success('Passkey registered')
        setShowAddDialog(false)
        setAddName('')
        await loadPasskeys()
      }
    } catch {
      toast.error('Failed to add passkey')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRename = async () => {
    if (!editingPasskey) return
    setIsUpdating(true)
    try {
      const { error } = await authClient.passkey.updatePasskey({
        id: editingPasskey.id,
        name: editName.trim(),
      })
      if (error) {
        toast.error(error.message || 'Failed to rename passkey')
      } else {
        toast.success('Passkey renamed')
        setEditingPasskey(null)
        await loadPasskeys()
      }
    } catch {
      toast.error('Failed to rename passkey')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      const { error } = await authClient.passkey.deletePasskey({ id })
      if (error) {
        toast.error(error.message || 'Failed to delete passkey')
      } else {
        toast.success('Passkey deleted')
        setDeletingId(null)
        // Optimistically remove from local state to avoid a loading flash;
        // the list won't change server-side between now and the next full reload
        setPasskeys((prev) => prev.filter((p) => p.id !== id))
      }
    } catch {
      toast.error('Failed to delete passkey')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Passkeys</CardTitle>
            <CardDescription>
              {isLoading
                ? 'Loading...'
                : `${passkeys.length} passkey${passkeys.length !== 1 ? 's' : ''} registered`}
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAddDialog(true)} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-1" />
            Add Passkey
          </Button>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : passkeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500 dark:text-gray-400">
              <KeyRound className="h-8 w-8 mb-3 opacity-30" />
              <p className="text-sm font-medium">No passkeys registered</p>
              <p className="text-xs mt-1">Add a passkey for faster, password-free sign in</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Device Type</TableHead>
                    <TableHead>Cloud Backed Up</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passkeys.map((pk) => (
                    <TableRow key={pk.id}>
                      <TableCell className="font-medium">
                        {pk.name ?? <span className="text-gray-400 italic text-sm">Unnamed</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {pk.deviceType.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={pk.backedUp ? 'default' : 'outline'}>
                          {pk.backedUp ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {pk.createdAt ? formatDate(pk.createdAt) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPasskey(pk)
                              setEditName(pk.name ?? '')
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Rename</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingId(pk.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Passkey Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Passkey</DialogTitle>
            <DialogDescription>
              Give your passkey a name to identify the device, then follow your
              browser&apos;s prompt to register it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="passkey-name">Name (optional)</Label>
            <Input
              id="passkey-name"
              placeholder="e.g. MacBook Touch ID"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isAdding && handleAdd()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isAdding}>
              {isAdding ? 'Registering...' : 'Register Passkey'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!editingPasskey} onOpenChange={() => setEditingPasskey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Passkey</DialogTitle>
            <DialogDescription>Update the name for this passkey.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-passkey-name">Name</Label>
            <Input
              id="edit-passkey-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isUpdating && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingPasskey(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Passkey?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this passkey. You won&apos;t be able
              to use it to sign in anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
