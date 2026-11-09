'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "../../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog"
import ConfirmSendDialog from "./confirmSendDialog"

interface Preview {
  subject: string | null
  from: string | null
  previewText: string | null
  html: string | null
  text: string | null
}

export default function BroadcastActions({ id, name, status }: { id: string; name: string; status: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const openPreview = async () => {
    setOpen(true)
    if (preview) return
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/marketing/${id}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to load preview")
      setPreview(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load preview")
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const send = async () => {
    setSending(true)
    try {
      const response = await fetch(`/api/admin/marketing/${id}`, { method: "POST" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to send broadcast")
      toast.success("Broadcast sent")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send broadcast")
    } finally {
      setSending(false)
    }
  }

  // Resend has no push for broadcast status, so poll while it's queued and
  // refresh the list once it moves on (e.g. to "sent").
  // ponytail: stops after ~5 min; a broadcast scheduled for later stays
  // "queued" until it goes out, so it's not worth polling that long.
  useEffect(() => {
    if (status !== "queued") return
    let tries = 0
    const timer = setInterval(async () => {
      if (++tries > 100) return clearInterval(timer)
      try {
        const response = await fetch(`/api/admin/marketing/${id}`)
        if (!response.ok) return
        const data = await response.json()
        if (data.status !== "queued") {
          clearInterval(timer)
          router.refresh()
        }
      } catch {
        // network blip, try again next tick
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [id, status, router])

  const isDraft = status === "draft"

  return (
    <>
      {status === "queued" && (
        <span className="flex items-center gap-1.5 text-xs">
          <span className="size-2 animate-pulse rounded-full bg-amber-500" />
          Sending…
        </span>
      )}
      <Button size="sm" variant="outline" onClick={openPreview}>Preview</Button>
      {isDraft && (
        <Button size="sm" disabled={sending} onClick={() => setConfirming(true)}>
          {sending ? "Sending…" : "Send"}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{preview?.subject || name}</DialogTitle>
            <DialogDescription>
              {preview ? `From ${preview.from ?? "—"}${preview.previewText ? ` · ${preview.previewText}` : ""}` : "Loading…"}
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="h-[60vh] animate-pulse rounded-md bg-muted" />
          ) : preview?.html ? (
            // sandbox="" — no scripts, no navigation out of the frame
            <iframe
              title="Email preview"
              sandbox=""
              srcDoc={preview.html}
              className="h-[60vh] w-full rounded-md border bg-white"
            />
          ) : (
            <pre className="h-[60vh] overflow-auto whitespace-pre-wrap rounded-md border p-4 text-sm">
              {preview?.text ?? ""}
            </pre>
          )}
          {isDraft && (
            <div className="flex justify-end">
              <Button disabled={sending || loading} onClick={() => setConfirming(true)}>
                {sending ? "Sending…" : "Send now"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmSendDialog
        open={confirming}
        onOpenChange={setConfirming}
        subject={preview?.subject || name}
        audience="its segment"
        onConfirm={send}
      />
    </>
  )
}
