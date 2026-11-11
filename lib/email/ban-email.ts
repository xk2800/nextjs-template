import "server-only"
import { config } from "@/config/env"
import { getResend, EMAIL_FROM } from "@/lib/email/resend"

// Tells a banned user why they can't sign in. Best-effort: the ban has already happened,
// so a mail failure is logged, never thrown. Self-disables when Resend isn't configured.
export async function sendBanEmail(user: { name: string | null; email: string }, reason?: string | null) {
  if (!config.RESEND_API_KEY) return
  try {
    const { EmailTemplateBanned } = await import("@/components/email/security/account-banned")
    const { error } = await (await getResend()).emails.send({
      from: EMAIL_FROM,
      to: [user.email],
      subject: `Your ${config.APP_NAME} account has been suspended`,
      react: EmailTemplateBanned({ firstName: user.name || "there", appName: config.APP_NAME, reason }),
    })
    if (error) console.error("Failed to send ban email", error)
  } catch (error) {
    console.error("Failed to send ban email", error)
  }
}
