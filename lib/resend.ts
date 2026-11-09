import "server-only"
import type { Resend } from "resend"
import { config } from "@/config/env"

// From env, not hardcoded: scaffolded apps run this module from the package's
// bundled auth, so a local edit here would never reach their auth emails.
export const EMAIL_FROM = config.EMAIL_FROM

// Loaded on first send, so projects that never send email don't pay for it
// at startup.
let resend: Resend | undefined
export async function getResend() {
  if (!resend) {
    const { Resend } = await import("resend")
    resend = new Resend(config.RESEND_API_KEY)
  }
  return resend
}

// Broadcasts need a full access key, so they can use their own and leave
// RESEND_API_KEY as a sending-only key.
export const BROADCAST_API_KEY = config.RESEND_BROADCAST_API_KEY || config.RESEND_API_KEY

let broadcastResend: Resend | undefined
export async function getBroadcastResend() {
  if (!broadcastResend) {
    const { Resend } = await import("resend")
    broadcastResend = new Resend(BROADCAST_API_KEY)
  }
  return broadcastResend
}
