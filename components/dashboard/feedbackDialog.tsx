'use client'

import { useState } from "react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import { MessageSquare } from "lucide-react"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"

// Keep in sync with the cap in app/api/feedback/route.ts.
const FEEDBACK_MAX_LENGTH = 2000

type FeedbackType = "bug" | "feedback"

/**
 * Header button + dialog that POSTs to /api/feedback. Render it only when a
 * feedback channel is configured (FEEDBACK_DISCORD_WEBHOOK_URL or
 * FEEDBACK_EMAIL); otherwise the route answers 503.
 */
export default function FeedbackDialog() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>("feedback")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message, page: pathname }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to send feedback")

      toast.success("Thanks! Your feedback was sent.")
      setMessage("")
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send feedback")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <MessageSquare />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Send feedback</DialogTitle>
            <DialogDescription>
              Report a bug or tell us what could be better.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2" role="radiogroup" aria-label="Feedback type">
            {(["feedback", "bug"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                variant={type === t ? "default" : "outline"}
                size="sm"
                onClick={() => setType(t)}
              >
                {t === "bug" ? "Bug report" : "General feedback"}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">
              {type === "bug" ? "What happened, and what did you expect?" : "Your feedback"}
            </Label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={FEEDBACK_MAX_LENGTH}
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/{FEEDBACK_MAX_LENGTH}
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSending || !message.trim()}>
              {isSending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
