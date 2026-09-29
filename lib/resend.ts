import "server-only"
import type { Resend } from "resend"
import { config } from "@/config/env"

// export const EMAIL_FROM = "Acme <onboarding@xavierkhew.com>"
export const EMAIL_FROM = "Acme <onboarding@xavierkhew.xyz>"

// resend is an optional peer dep: loaded on first send so projects that never
// send email don't need it installed.
let resend: Resend | undefined
export async function getResend() {
  if (!resend) {
    const { Resend } = await import("resend")
    resend = new Resend(config.RESEND_API_KEY)
  }
  return resend
}
