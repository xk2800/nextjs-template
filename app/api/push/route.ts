import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { eq, and } from "drizzle-orm"
import { auth } from "@/server/auth"
import { db } from "@/server/db"
import { pushSubscriptions } from "@/server/db/schema"
import { pushEnabled } from "@/lib/push"

async function userId() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user.id
}

// The public VAPID key, read at runtime so it needn't be set at build time.
export async function GET() {
  if (!(await userId())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ publicKey: pushEnabled ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY : "" })
}

// Save this device's subscription. Called on enable and again on every app
// open, so a subscription the browser rotated gets replaced.
export async function POST(request: Request) {
  const id = await userId()
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!pushEnabled) return NextResponse.json({ error: "Push is not configured" }, { status: 503 })

  const sub = await request.json().catch(() => null)
  const { endpoint, keys } = sub ?? {}
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }

  const row = { userId: id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent: request.headers.get("user-agent") }
  // If the same browser switches accounts, the endpoint moves to the new user.
  await db.insert(pushSubscriptions).values(row).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: row })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const id = await userId()
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { endpoint } = (await request.json().catch(() => ({}))) as { endpoint?: string }
  if (!endpoint) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })

  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, id)))
  return NextResponse.json({ ok: true })
}
