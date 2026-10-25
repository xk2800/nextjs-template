import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { hasRole } from "@/lib/auth-helpers"
import { getBroadcastResend } from "@/lib/resend"
import { unexpectedErrorMessage } from "@/lib/errors"

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasRole(session.user.role, 'admin')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return null
}

// Preview: the broadcast's subject and HTML as Resend stored it.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
