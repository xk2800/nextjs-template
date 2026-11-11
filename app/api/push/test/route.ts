import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/server/auth"
import { sendPushToUser } from "@/lib/push/push"

// Sends a test notification to all of the signed-in user's devices. To notify
// from your own code, call sendPushToUser(userId, { title, body, url }).
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const result = await sendPushToUser(session.user.id, {
    title: "Test notification",
    body: "Push notifications are working on this device.",
    url: "/dashboard/settings",
  })
  return NextResponse.json(result)
}
