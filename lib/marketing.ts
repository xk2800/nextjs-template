import "server-only"
// Marketing email data helpers, shipped as `@xk2800/nextjs-template/marketing`.
// Everything goes through Resend Broadcasts/Contacts with the broadcast key,
// so it never touches the transactional sending quota.
import { config } from "../config/env"
import { getBroadcastResend, BROADCAST_API_KEY } from "./resend"

// The segment users join from the dashboard toggle. Blank = toggle hidden.
export const MARKETING_SEGMENT_ID = config.RESEND_MARKETING_SEGMENT_ID

export interface MarketingSegment {
  id: string
  name: string
}

export interface MarketingBroadcast {
  id: string
  name: string | null
  status: string
  created_at: string
  sent_at: string | null
}

export interface MarketingContact {
  id: string
  email: string
  first_name?: string
  last_name?: string
  unsubscribed: boolean
  created_at: string
}

// Segments + the 10 latest broadcasts for the admin page. `error` is set
// instead of throwing, so the page can explain a missing or sending-only key.
export async function getMarketingOverview(): Promise<{
  segments: MarketingSegment[]
  broadcasts: MarketingBroadcast[]
  error: string | null
}> {
  if (!BROADCAST_API_KEY) {
    return { segments: [], broadcasts: [], error: "Neither RESEND_BROADCAST_API_KEY nor RESEND_API_KEY is set." }
  }

  const resend = await getBroadcastResend()
  const [segRes, bcRes] = await Promise.all([
    resend.segments.list(),
    resend.broadcasts.list({ limit: 10 }),
  ])
  if (segRes.error) return { segments: [], broadcasts: [], error: segRes.error.message }
  return { segments: segRes.data.data, broadcasts: bcRes.data?.data ?? [], error: null }
}

// ponytail: first page only (Resend max 100); add cursor paging (`after`)
// if a segment outgrows it.
export const SEGMENT_CONTACTS_LIMIT = 100

export async function listSegmentContacts(segmentId: string): Promise<{
  contacts: MarketingContact[]
  hasMore: boolean
  error: string | null
}> {
  const { data, error } = await (await getBroadcastResend()).contacts.list({ segmentId, limit: SEGMENT_CONTACTS_LIMIT })
  if (error) return { contacts: [], hasMore: false, error: error.message }
  return { contacts: data.data, hasMore: data.has_more, error: null }
}

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
