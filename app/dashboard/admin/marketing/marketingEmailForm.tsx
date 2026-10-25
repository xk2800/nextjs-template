'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ConfirmSendDialog from "./confirmSendDialog"

export default function MarketingEmailForm({ segments }: { segments: { id: string; name: string }[] }) {
  const router = useRouter()
  const [segmentId, setSegmentId] = useState(segments[0]?.id ?? "")
  const [subject, setSubject] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [body, setBody] = useState("")
  const [pending, setPending] = useState<"draft" | "send" | null>(null)

  const [confirming, setConfirming] = useState(false)
  const segmentName = segments.find((s) => s.id === segmentId)?.name ?? "this segment"

  const submit = async (send: boolean) => {
    setPending(send ? "send" : "draft")
    try {
      const response = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentId, subject, previewText, body, send }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to create broadcast")

      toast.success(send ? "Broadcast sent" : "Draft saved in Resend")
      setSubject("")
      setPreviewText("")
      setBody("")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create broadcast")
    } finally {
      setPending(null)
    }
  }

  if (segments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No segments yet</CardTitle>
          <CardDescription>
            Create a segment and add contacts in the Resend dashboard (Audience), then reload this page.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const canSubmit = !!segmentId && !!subject.trim() && !!body.trim() && !pending

  return (
    <Card>
      <CardHeader>
        <CardTitle>New broadcast</CardTitle>
        <CardDescription>
          Plain text. Blank lines start a new paragraph. An unsubscribe link is added automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="segment">Segment</Label>
          <Select value={segmentId} onValueChange={setSegmentId}>
            <SelectTrigger id="segment" className="w-full">
              <SelectValue placeholder="Choose a segment" />
            </SelectTrigger>
            <SelectContent>
              {segments.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" value={subject} maxLength={200} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preview">Preview text (optional)</Label>
          <Input id="preview" value={previewText} maxLength={200} onChange={(e) => setPreviewText(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <Textarea id="body" rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" disabled={!canSubmit} onClick={() => submit(false)}>
            {pending === "draft" ? "Saving…" : "Save as draft"}
          </Button>
          <Button disabled={!canSubmit} onClick={() => setConfirming(true)}>
            {pending === "send" ? "Sending…" : "Send now"}
          </Button>
        </div>
        <ConfirmSendDialog
          open={confirming}
          onOpenChange={setConfirming}
          subject={subject}
          audience={`"${segmentName}"`}
          onConfirm={() => submit(true)}
        />
      </CardContent>
    </Card>
  )
}
