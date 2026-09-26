'use client'

import { useEffect } from 'react'
import { useSession } from '../../lib/auth-client'
import { getVisitorId } from '../../lib/device-fingerprint'
import { useCookieConsent } from '../../lib/cookie-consent'

// Mount once (e.g. in the root layout). When a session is present it computes
// a FingerprintJS device id and hands it to /api/device-check, which emails
// the user if the account has never signed in from this device before.
//
// Driven by "a session exists", not by the sign-in call, so it covers
// email/password, Google OAuth and One Tap without touching any of them. The
// endpoint is idempotent — the alert only fires on the first ever POST for a
// given (user, device).
export default function DeviceCheck() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  // The fingerprint needs optional-cookie consent (lib/device-fingerprint.ts);
  // re-run when it's granted so the check doesn't wait for the next page load.
  const consent = useCookieConsent()

  useEffect(() => {
    if (!userId || consent !== 'all') return

    const run = async () => {
      try {
        if (sessionStorage.getItem('device-checked') === userId) return
      } catch {
        // No sessionStorage (private mode etc.) — fall through. The endpoint
        // is idempotent, so the cost is at most one redundant POST per load.
      }

      const visitorId = await getVisitorId()
      if (!visitorId) return

      await fetch('/api/device-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      })

      try {
        sessionStorage.setItem('device-checked', userId)
      } catch {
        // ignore — see above
      }
    }

    // Best-effort: fingerprinting or the network failing must never surface
    // to the user mid-app.
    run().catch(() => {})
  }, [userId, consent])

  return null
}
