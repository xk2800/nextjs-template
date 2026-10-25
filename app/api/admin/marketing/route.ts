import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth-helpers"
import { getBroadcastResend, EMAIL_FROM } from "@/lib/resend"
import { textToBroadcastHtml, textToBroadcastText } from "@/lib/marketing-email"
import { z } from "zod"
import { unexpectedErrorMessage } from "@/lib/errors"

const postSchema = z.object({
  segmentId: z.string().min(1),
  subject: z.string().trim().min(1).max(200),
  previewText: z.string().trim().max(200).optional(),
  body: z.string().trim().min(1).max(50000),
  send: z.boolean(),
})

// Sends through Resend Broadcasts (marketing quota), not emails.send
// (transactional quota), so a newsletter can't eat the daily send limit
// that password resets and verification emails rely on.
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasRole(session.user.role, 'admin')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = postSchema.safeParse(await request.json().catch(() => null))
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
