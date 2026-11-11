import 'server-only'
import webpush from 'web-push'
import { eq, inArray } from 'drizzle-orm'
import { config } from '@/config/env'
import { db } from '@/server/db'
import { pushSubscriptions } from '@/server/db/schema'

// Web Push example. Browsers get the public key from NEXT_PUBLIC_VAPID_PUBLIC_KEY.
export const pushEnabled = !!(
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  config.VAPID_PRIVATE_KEY &&
  config.VAPID_SUBJECT
)

export type PushPayload = { title: string; body?: string; url?: string }

// Sends to every device the user subscribed. Subscriptions the push service
// reports gone (404/410: expired, uninstalled, or cleared by the browser, which
// happens to devices that stay unused for a while) are deleted so we stop
// sending to them. The app re-subscribes on the user's next visit.
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!pushEnabled) return { sent: 0, removed: 0 }
  webpush.setVapidDetails(config.VAPID_SUBJECT, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, config.VAPID_PRIVATE_KEY)

  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
  const dead: string[] = []
  let sent = 0

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          // TTL: how long the push service holds it while the device is offline.
          { TTL: 60 * 60 * 24, urgency: 'normal' }
        )
        sent++
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) dead.push(s.endpoint)
        else console.error('Push send failed', status, e)
      }
    })
  )

  if (dead.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.endpoint, dead))
  return { sent, removed: dead.length }
}
