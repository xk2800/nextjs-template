import "server-only"
import { config } from "@/config/env"
import { getBroadcastResend } from "@/lib/resend"

// The segment users join from the dashboard toggle. Blank = toggle hidden.
export const MARKETING_SEGMENT_ID = config.RESEND_MARKETING_SEGMENT_ID

// Resend is the source of truth, so the toggle also reflects someone who
// clicked Unsubscribe in an email or was edited in the Resend dashboard.
export async function isSubscribed(email: string): Promise<boolean> {
  const resend = await getBroadcastResend()
  const contact = await resend.contacts.get({ email })
  if (contact.error) {
    if (contact.error.name === "not_found") return false
    throw new Error(contact.error.message)
  }
  if (contact.data.unsubscribed) return false

  const segments = await resend.contacts.segments.list({ email })
  if (segments.error) throw new Error(segments.error.message)
  return segments.data.data.some((s) => s.id === MARKETING_SEGMENT_ID)
}

export async function setSubscribed(email: string, name: string, subscribed: boolean) {
  const resend = await getBroadcastResend()
  const contact = await resend.contacts.get({ email })
  const exists = !contact.error
  if (contact.error && contact.error.name !== "not_found") throw new Error(contact.error.message)

  if (!subscribed) {
    // Same as the email's Unsubscribe link: opted out of every broadcast.
    if (!exists) return
    const { error } = await resend.contacts.update({ email, unsubscribed: true })
    if (error) throw new Error(error.message)
    return
  }

  const { error } = exists
    ? await resend.contacts.update({ email, unsubscribed: false })
    : await resend.contacts.create({ email, firstName: name || undefined, unsubscribed: false })
  if (error) throw new Error(error.message)

  const segments = await resend.contacts.segments.list({ email })
  if (segments.error) throw new Error(segments.error.message)
  if (!segments.data.data.some((s) => s.id === MARKETING_SEGMENT_ID)) {
    const added = await resend.contacts.segments.add({ email, segmentId: MARKETING_SEGMENT_ID })
    if (added.error) throw new Error(added.error.message)
  }
}
