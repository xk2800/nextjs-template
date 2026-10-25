import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { z } from "zod"
import { MARKETING_SEGMENT_ID, setSubscribed } from "@/lib/marketing-subscription"
import { unexpectedErrorMessage } from "@/lib/errors"

const putSchema = z.object({ subscribed: z.boolean() })

// The signed-in user opts their own account email in or out of product
// updates (RESEND_MARKETING_SEGMENT_ID).
export async function PUT(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!MARKETING_SEGMENT_ID) {
    return NextResponse.json({ error: "Product updates aren't set up" }, { status: 404 })
  }

  const parsed = putSchema.safeParse(await request.json().catch(() => null))
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
