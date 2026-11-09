import "server-only"
// Route handlers behind the marketing email components. Shipped as
// `@xk2800/nextjs-template/api/marketing` so apps mount them with one-line routes:
//   app/api/admin/marketing/route.ts:      export { createBroadcastPOST as POST } from "@xk2800/nextjs-template/api/marketing"
//   app/api/admin/marketing/[id]/route.ts: export { getBroadcastGET as GET, sendBroadcastPOST as POST } from "@xk2800/nextjs-template/api/marketing"
//   app/api/marketing/subscription/route.ts: export { updateSubscriptionPUT as PUT } from "@xk2800/nextjs-template/api/marketing"
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "../server/auth"
import { hasRole } from "./auth-helpers"
import { getBroadcastResend, EMAIL_FROM } from "./resend"
import { MARKETING_SEGMENT_ID, setSubscribed } from "./marketing"
import { textToBroadcastHtml, textToBroadcastText } from "./marketing-email"
import { unexpectedErrorMessage } from "./errors"

type IdParams = { params: Promise<{ id: string }> }

async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

async function requireAdmin() {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasRole(session.user.role, 'admin')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return null
}

const createSchema = z.object({
  segmentId: z.string().min(1),
  subject: z.string().trim().min(1).max(200),
  previewText: z.string().trim().max(200).optional(),
  body: z.string().trim().min(1).max(50000),
  send: z.boolean(),
})

// Sends through Resend Broadcasts (marketing quota), not emails.send
// (transactional quota), so a newsletter can't eat the daily send limit
// that password resets and verification emails rely on.
export async function createBroadcastPOST(request: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Segment, subject and message are required" }, { status: 400 })
  }

  const { segmentId, subject, previewText, body, send } = parsed.data

  try {
    const resend = await getBroadcastResend()
    const created = await resend.broadcasts.create({
      segmentId,
      from: EMAIL_FROM,
      subject,
      previewText: previewText || undefined,
      name: subject,
      html: textToBroadcastHtml(body),
      text: textToBroadcastText(body),
    })
    if (created.error) {
      return NextResponse.json({ error: created.error.message }, { status: 502 })
    }

    if (send) {
      const sent = await resend.broadcasts.send(created.data.id)
      if (sent.error) {
        return NextResponse.json(
          { error: `Draft saved in Resend, but sending failed: ${sent.error.message}` },
          { status: 502 }
        )
      }
    }

    return NextResponse.json({ success: true, id: created.data.id, sent: send })
  } catch (error) {
    return NextResponse.json(
      { error: unexpectedErrorMessage(error, "Failed to create broadcast") },
      { status: 500 }
    )
  }
}

// Preview: the broadcast's subject and HTML as Resend stored it.
export async function getBroadcastGET(_request: NextRequest, { params }: IdParams) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const { id } = await params
    const { data, error } = await (await getBroadcastResend()).broadcasts.get(id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 })
    }

    return NextResponse.json({
      subject: data.subject,
      from: data.from,
      previewText: data.preview_text,
      html: data.html,
      text: data.text,
      status: data.status,
    })
  } catch (error) {
    return NextResponse.json(
      { error: unexpectedErrorMessage(error, "Failed to load broadcast") },
      { status: 500 }
    )
  }
}

// Send a saved draft. Resend rejects sending one that's already gone out,
// but check first so the error is readable.
export async function sendBroadcastPOST(_request: NextRequest, { params }: IdParams) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const { id } = await params
    const resend = await getBroadcastResend()

    const current = await resend.broadcasts.get(id)
    if (current.error) {
      return NextResponse.json({ error: current.error.message }, { status: 502 })
    }
    if (current.data.status !== "draft") {
      return NextResponse.json({ error: "This broadcast has already been sent" }, { status: 409 })
    }

    const sent = await resend.broadcasts.send(id)
    if (sent.error) {
      return NextResponse.json({ error: sent.error.message }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: unexpectedErrorMessage(error, "Failed to send broadcast") },
      { status: 500 }
    )
  }
}

const subscriptionSchema = z.object({ subscribed: z.boolean() })

// The signed-in user opts their own account email in or out of product
// updates (RESEND_MARKETING_SEGMENT_ID).
export async function updateSubscriptionPUT(request: NextRequest) {
  const session = await getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!MARKETING_SEGMENT_ID) {
    return NextResponse.json({ error: "Product updates aren't set up" }, { status: 404 })
  }

  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  // Opting in needs a verified address, or anyone could sign up with
  // someone else's email and subscribe them. Opting out never does.
  if (parsed.data.subscribed && !session.user.emailVerified) {
    return NextResponse.json({ error: "Verify your email address first" }, { status: 403 })
  }

  try {
    await setSubscribed(session.user.email, session.user.name, parsed.data.subscribed)
    return NextResponse.json({ subscribed: parsed.data.subscribed })
  } catch (error) {
    return NextResponse.json(
      { error: unexpectedErrorMessage(error, "Failed to update subscription") },
      { status: 500 }
    )
  }
}
