"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { COOKIE_BANNER_ENABLED, setCookieConsent, useCookieConsent } from "@/lib/cookie-consent"

// Mount once in the root layout. Shows until the visitor picks an option;
// "Necessary only" is as prominent as "Accept all" on purpose — GDPR requires
// rejecting to be as easy as accepting.
export function CookieBanner() {
  const consent = useCookieConsent()
  // useCookieConsent() is null on the server *and* before a choice, so wait
  // for mount to tell them apart — otherwise returning visitors see a flash.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!COOKIE_BANNER_ENABLED || !mounted || consent) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-lg border border-border bg-background p-4 shadow-lg"
    >
      <p className="text-sm text-muted-foreground">
        We use necessary cookies to keep you signed in. With your permission we also use a device
        fingerprint to detect suspicious sign-ins, and Google One Tap sign-in.{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
          Privacy policy
        </Link>
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setCookieConsent("necessary")}>
          Necessary only
        </Button>
        <Button size="sm" onClick={() => setCookieConsent("all")}>
          Accept all
        </Button>
      </div>
    </div>
  )
}

// Withdrawing consent must be as easy as giving it — this reopens the banner.
export function CookieSettingsButton({ className }: { className?: string }) {
  if (!COOKIE_BANNER_ENABLED) return null
  return (
    <button type="button" className={className} onClick={() => setCookieConsent(null)}>
      Cookie settings
    </button>
  )
}
