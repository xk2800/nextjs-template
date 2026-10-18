import "server-only"
// POST handler behind components/dashboard/feedbackDialog.tsx. Shipped as
// `@xk2800/nextjs-template/api/feedback` so apps mount it with a one-line
// app/api/feedback/route.ts: export { POST } from "@xk2800/nextjs-template/api/feedback"
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "../server/auth"
import { config } from "../config/env"
import { getResend, EMAIL_FROM } from "./resend"
import { getSystemSettings } from "./settings-queries"
import { lookupErrorDetail, unexpectedErrorMessage } from "./errors"

const feedbackSchema = z.object({
  type: z.enum(["bug", "feedback"]),
  // Keep in sync with FEEDBACK_MAX_LENGTH in components/dashboard/feedbackDialog.tsx.
  message: z.string().trim().min(1).max(2000),
  page: z.string().max(300).optional(),
  // The error the user reported from (FeedbackDialog's errorDetails).
  error: z.string().max(2000).optional(),
})

// const COOLDOWN_MS = 30_000
const COOLDOWN_MS = 0
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
  // Admin-controlled (System Settings → Feedback); off drops it entirely.
  const errorDetails =
    parsed.data.error && (await getSystemSettings()).feedbackAttachErrors
      ? parsed.data.error
      : undefined
  // Technical detail stored under the error's ref (lib/errors.ts). Goes
  // server → Discord/email only; the browser never sees it.
  const technicalDetail = errorDetails ? await lookupErrorDetail(errorDetails) : null
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
              ...(errorDetails ? [{ name: "Error", value: errorDetails.slice(0, 1024) }] : []),
              ...(technicalDetail
                ? [{ name: "Technical details", value: "```\n" + technicalDetail.slice(0, 1000) + "\n```" }]
                : []),
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
          text: `${message}\n\n---\nUser: ${user.name} <${user.email}>\nPage: ${page || "unknown"}${errorDetails ? `\nError: ${errorDetails}` : ""}${technicalDetail ? `\n\nTechnical details:\n${technicalDetail}` : ""}\nUser agent: ${userAgent}`,
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

/**
 * Development-only endpoint behind FeedbackTestForm, for testing the
 * report-from-error flow. "!error" answers with a safe, user-facing error;
 * "!crash" simulates an unexpected failure, so the user gets a generic message
 * with an error ref and the technical detail only reaches the server log.
 * 404 outside development.
 * Mount with app/api/feedback/test/route.ts:
 *   export { testErrorPOST as POST } from "@xk2800/nextjs-template/api/feedback"
 */
export async function testErrorPOST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json().catch(() => null)
  if (typeof body?.text === "string" && body.text.trim() === "!error") {
    return NextResponse.json({ error: "Test error from the feedback test form" }, { status: 400 })
  }
  if (typeof body?.text === "string" && body.text.trim() === "!crash") {
    const crash = new Error("Test crash: DB connection to postgres://admin:hunter2@db.internal failed")
    return NextResponse.json({ error: unexpectedErrorMessage(crash) }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
