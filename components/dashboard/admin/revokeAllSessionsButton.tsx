'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "../../ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog"

// Kills every session for one account — the fast path when a new-device alert
// turns out to be a hijack. Hits the existing admin route with no sessionId,
// which deletes them all and writes a session_revoked audit entry.
export default function RevokeAllSessionsButton({
  userId,
  label = "Revoke all sessions",
  size = "sm",
}: {
  userId: string
  label?: string
  size?: "sm" | "default"
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const revoke = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/sessions`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("All sessions revoked")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Failed to revoke sessions")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button variant="destructive" size={size} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke all sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              Logs this account out of every device. Cached sessions may stay valid for
              up to 5 minutes. The user can sign back in normally afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={revoke}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? "Revoking..." : "Revoke all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
