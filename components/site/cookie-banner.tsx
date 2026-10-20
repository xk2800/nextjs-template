"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

// Relative imports: this file ships raw in the npm package, where `@/` would
// resolve against the consuming project instead.
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import { Label } from "../ui/label"
import {
  readConsent,
  setCookieConsent,
  useConsentRequired,
  useCookieConsent,
  type ConsentPurpose,
} from "../../lib/cookie-consent"
import { CONSENT_VERSION } from "../../lib/cookie-names"
import { useSession } from "../../lib/auth-client"

// Last choice sent to app/api/consent from this browser, as
// "userId|choice|version", so each choice is recorded once, not on every load.
const RECORDED_KEY = "consent-recorded"

// Proof of consent: once a signed-in user has a choice (made now, or before
// they signed in), record it server-side. The route is idempotent, so a lost
// localStorage marker only costs one redundant request.
function useRecordConsent(consentRequired: boolean) {
  const consent = useCookieConsent()
  const { data: session } = useSession()
  const userId = session?.user?.id

  useEffect(() => {
    if (!consentRequired || !userId || consent === null) return
    const choice = readConsent()
    if (!choice) return
    const marker = `${userId}|${choice}|${CONSENT_VERSION}`
    try {
      if (localStorage.getItem(RECORDED_KEY) === marker) return
    } catch {
      // No localStorage — fall through; the route dedupes.
    }
    fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice }),
    })
      .then((res) => {
        if (!res.ok) return
        try {
          localStorage.setItem(RECORDED_KEY, marker)
        } catch {
          // ignore
        }
      })
      .catch(() => {})
  }, [consentRequired, userId, consent])
}

const PURPOSES: { id: ConsentPurpose; label: string; description: string }[] = [
  {
    id: "fingerprint",
    label: "Security fingerprint",
    description:
      "A device identifier built from your browser and device characteristics, used to alert you about sign-ins from new devices and to block repeated failed sign-ins.",
  },
  {
    id: "onetap",
    label: "Google One Tap",
    description: "Quick sign-in with Google. Loads a Google script that may set Google's own cookies.",
  },
]

// Mount once in the root layout. Shows until the visitor picks an option;
// "Necessary only" is as prominent as "Accept all" on purpose — GDPR requires
// rejecting to be as easy as accepting. "Customize" gives one choice per
// purpose, unticked by default (pre-ticked boxes aren't valid consent).
export function CookieBanner() {
  const consent = useCookieConsent()
  const consentRequired = useConsentRequired()
  const [customizing, setCustomizing] = useState(false)
  const [picked, setPicked] = useState<ConsentPurpose[]>([])
  // useCookieConsent() is null on the server *and* before a choice, so wait
  // for mount to tell them apart — otherwise returning visitors see a flash.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useRecordConsent(consentRequired)

  if (!consentRequired || !mounted || consent) return null

  const toggle = (id: ConsentPurpose, on: boolean) =>
    setPicked((prev) => (on ? [...prev, id] : prev.filter((p) => p !== id)))

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-lg border border-border bg-background p-4 shadow-lg"
    >
      <p className="text-sm text-muted-foreground">
        We use necessary cookies to keep you signed in. With your permission we also use a security
        fingerprint, built from your browser and device characteristics, to detect suspicious
        sign-ins, and Google One Tap sign-in. You can allow each separately.{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
          Privacy policy
        </Link>
      </p>

      {customizing && (
        <div className="mt-3 space-y-3">
          {PURPOSES.map((p) => (
            <div key={p.id} className="flex items-start gap-3">
              <Checkbox
                id={`consent-${p.id}`}
                checked={picked.includes(p.id)}
                onCheckedChange={(checked) => toggle(p.id, checked === true)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor={`consent-${p.id}`}>{p.label}</Label>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setCookieConsent("necessary")}>
          Necessary only
        </Button>
        {customizing ? (
          <Button variant="outline" size="sm" onClick={() => setCookieConsent(picked)}>
            Save choices
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setCustomizing(true)}>
            Customize
          </Button>
        )}
        <Button size="sm" onClick={() => setCookieConsent("all")}>
          Accept all
        </Button>
      </div>
    </div>
  )
}

// Withdrawing consent must be as easy as giving it — this reopens the banner.
export function CookieSettingsButton({ className }: { className?: string }) {
  const consentRequired = useConsentRequired()
  if (!consentRequired) return null
  return (
    <button type="button" className={className} onClick={() => setCookieConsent(null)}>
      Cookie settings
    </button>
  )
}
