'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  PUSH_FLAG,
  VAPID_PUBLIC_KEY,
  getRegistration,
  pushSupported,
  saveSubscription,
  subscribe,
} from '@/lib/push-client'

type State = 'loading' | 'unsupported' | 'no-worker' | 'denied' | 'off' | 'on'

// Example: turn push notifications on or off for this device and send a test.
// Hidden unless the VAPID keys are set (see .env.development.example).
export default function PushNotificationsCard() {
  const [state, setState] = useState<State>('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (!pushSupported()) return setState('unsupported')
      const reg = await getRegistration()
      if (!reg) return setState('no-worker')
      if (Notification.permission === 'denied') return setState('denied')
      setState((await reg.pushManager.getSubscription()) ? 'on' : 'off')
    })().catch(() => setState('unsupported'))
  }, [])

  if (!VAPID_PUBLIC_KEY) return null

  async function toggle(next: boolean) {
    setBusy(true)
    try {
      const reg = await getRegistration()
      if (!reg) throw new Error('Service worker not registered')
      if (next) {
        if ((await Notification.requestPermission()) !== 'granted') return setState('denied')
        const res = await saveSubscription(await subscribe(reg))
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to save subscription')
        localStorage.setItem(PUSH_FLAG, '1')
        setState('on')
      } else {
        localStorage.removeItem(PUSH_FLAG)
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/push', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
        }
        setState('off')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function sendTest() {
    setBusy(true)
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      if (!data.sent) toast.error('No active device found. Turn notifications off and on again.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send')
    } finally {
      setBusy(false)
    }
  }

  const note: Partial<Record<State, string>> = {
    unsupported:
      "This browser can't receive push notifications. On iPhone and iPad, install the app to your Home Screen first (see below), then open it from there.",
    'no-worker': 'Notifications are only available in production builds (bun run build && bun run start).',
    denied: 'Notifications are blocked for this site. Allow them in your browser or system settings, then reload.',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Push notifications</CardTitle>
        <CardDescription>Get notified on this device, even when the app is closed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="push-notifications">Notify me on this device</Label>
          <Switch
            id="push-notifications"
            checked={state === 'on'}
            disabled={busy || (state !== 'on' && state !== 'off')}
            onCheckedChange={toggle}
          />
        </div>
        {note[state] && <p className="text-sm text-muted-foreground">{note[state]}</p>}
        {state === 'on' && (
          <Button variant="outline" size="sm" disabled={busy} onClick={sendTest}>
            Send test notification
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
