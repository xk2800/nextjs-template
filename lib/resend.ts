import "server-only"
import { Resend } from "resend"
import { config } from "@/config/env"

export const EMAIL_FROM = "Acme <onboarding@xavierkhew.com>"

let resend: Resend | undefined
export function getResend() {
  if (!resend) resend = new Resend(config.RESEND_API_KEY)
  return resend
}
