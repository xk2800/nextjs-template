import "server-only"
import type { Resend } from "resend"
import { config } from "@/config/env"

// From env, not hardcoded: scaffolded apps run this module from the package's
// bundled auth, so a local edit here would never reach their auth emails.
export const EMAIL_FROM = config.EMAIL_FROM

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
