'use client'

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function MarketingUpdatesCard({
  initialSubscribed,
  emailVerified,
}: {
  initialSubscribed: boolean
  emailVerified: boolean
}) {
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [saving, setSaving] = useState(false)

  const toggle = async (next: boolean) => {
    setSaving(true)
    try {
      const response = await fetch("/api/marketing/subscription", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscribed: next }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to update subscription")
      setSubscribed(next)
      toast.success(next ? "Subscribed to product updates" : "Unsubscribed from product updates")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update subscription")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email updates</CardTitle>
        <CardDescription>
          Occasional news about new features. You can turn this off here or with the link in any email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="marketing-updates">Send me product updates</Label>
          <Switch
            id="marketing-updates"
            checked={subscribed}
            disabled={saving || (!subscribed && !emailVerified)}
            onCheckedChange={toggle}
          />
        </div>
        {!subscribed && !emailVerified && (
          <p className="text-sm text-muted-foreground">Verify your email address to subscribe.</p>
        )}
      </CardContent>
    </Card>
  )
}
