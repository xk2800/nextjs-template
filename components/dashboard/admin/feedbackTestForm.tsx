'use client'

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { toastError } from "../errorFeedback"

/**
 * Development-only: submits to /api/feedback/test so the error toast → Report
 * → feedback flow can be tried end to end. "!error" fails with a safe message;
 * "!crash" fails like a real bug (generic message + error ref, details in the
 * server log only).
 */
export default function FeedbackTestForm() {
  const [text, setText] = useState("!crash")
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    try {
      const response = await fetch("/api/feedback/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Test request failed")
      toast.success('No error. Submit "!crash" or "!error" to trigger one.')
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Test request failed")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-dashed p-3">
      <Label htmlFor="feedback-test-input">Test error reporting (development only)</Label>
      <p className="text-sm text-gray-500">
        Submit &quot;!crash&quot; for an unexpected error (you get a ref, the details go to the
        server log) or &quot;!error&quot; for a safe validation-style error. Then tap Report on
        the toast.
      </p>
      <div className="flex gap-2">
        <Input id="feedback-test-input" value={text} onChange={(e) => setText(e.target.value)} />
        <Button type="submit" variant="outline" disabled={isSending}>
          {isSending ? "Sending..." : "Submit"}
        </Button>
      </div>
    </form>
  )
}
