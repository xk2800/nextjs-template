import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/server/auth"
import { config } from "@/config/env"
import { getResend, EMAIL_FROM } from "@/lib/resend"

const feedbackSchema = z.object({
  type: z.enum(["bug", "feedback"]),
  // Keep in sync with FEEDBACK_MAX_LENGTH in components/dashboard/feedbackDialog.tsx.
  message: z.string().trim().min(1).max(2000),
  page: z.string().max(300).optional(),
})

const COOLDOWN_MS = 30_000
// const COOLDOWN_MS = 0
// ponytail: in-memory, per instance; move to a DB/Redis counter if one user
// spamming across instances ever matters.
const lastSentAt = new Map<string, number>()

export async function POST(request: NextRequest) {
  const discordUrl = config.FEEDBACK_DISCORD_WEBHOOK_URL
  const emailTo = config.FEEDBACK_EMAIL
  if (!discordUrl && !emailTo) {
    return NextResponse.json({ error: "Feedback is not configured" }, { status: 503 })
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Message must be 1-2000 characters" }, { status: 400 })
  }

  const now = Date.now()
  if (now - (lastSentAt.get(session.user.id) ?? 0) < COOLDOWN_MS) {
    return NextResponse.json(
      { error: "Please wait a moment before sending more feedback" },
      { status: 429 }
    )
  }
  lastSentAt.set(session.user.id, now)

  const { type, message, page } = parsed.data
  const { user } = session
  const title = type === "bug" ? "🐞 Bug report" : "💬 Feedback"
  const userAgent = request.headers.get("user-agent") || "unknown"

  const sends: Promise<unknown>[] = []

  if (discordUrl) {
    sends.push(
      fetch(discordUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: config.APP_NAME,
          // User text must never ping @everyone/@here/roles in the channel.
          allowed_mentions: { parse: [] },
          embeds: [{
            title,
            description: message,
            color: type === "bug" ? 0xef4444 : 0x3b82f6,
            fields: [
              { name: "User", value: `${user.name} (${user.email})`.slice(0, 1024) },
              { name: "Page", value: page || "unknown", inline: true },
              { name: "User agent", value: userAgent.slice(0, 1024) },
            ],
            timestamp: new Date(now).toISOString(),
          }],
        }),
      }).then((res) => {
        if (!res.ok) throw new Error(`Discord webhook responded ${res.status}`)
      })
    )
  }

  if (emailTo) {
    sends.push(
      getResend()
        .then((resend) => resend.emails.send({
          from: EMAIL_FROM,
          to: emailTo.split(",").map((s) => s.trim()),
          replyTo: user.email,
          subject: `[${config.APP_NAME}] ${title} from ${user.name}`,
          text: `${message}\n\n---\nUser: ${user.name} <${user.email}>\nPage: ${page || "unknown"}\nUser agent: ${userAgent}`,
        }))
        .then(({ error }) => {
          if (error) throw new Error(error.message)
        })
    )
  }

  const results = await Promise.allSettled(sends)
  results.forEach((r) => {
    if (r.status === "rejected") console.error("Feedback delivery failed:", r.reason)
  })

  if (!results.some((r) => r.status === "fulfilled")) {
    lastSentAt.delete(user.id)
    return NextResponse.json({ error: "Failed to send feedback" }, { status: 502 })
  }
  return NextResponse.json({ success: true })
}
