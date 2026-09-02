import "server-only"
import { Resend } from "resend"
import { config } from "@/config/env"

// export const EMAIL_FROM = "Acme <onboarding@xavierkhew.com>"
export const EMAIL_FROM = "Acme <onboarding@xavierkhew.xyz>"

let resend: Resend | undefined
export function getResend() {
  if (!resend) resend = new Resend(config.RESEND_API_KEY)
  return resend
}
