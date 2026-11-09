'use client'

import { useEffect } from 'react'
import { useSession } from '../../lib/auth-client'
import { clearStoredVisitorId, getDeviceSignals, getStoredVisitorId, getVisitorId } from '../../lib/device-fingerprint'
import { useConsentFor, useCookieConsent } from '../../lib/cookie-consent'

// Mount once (e.g. in the root layout). When a session is present it computes
// a FingerprintJS device id and hands it to /api/device-check, which emails
// the user if the account has never signed in from this device before.
//
// Driven by "a session exists", not by the sign-in call, so it covers
// email/password, Google OAuth and One Tap without touching any of them. The
// endpoint is idempotent — the alert only fires on the first ever POST for a
// given (user, device).
//
// Also handles withdrawn consent: once the visitor's choice no longer
// includes the "fingerprint" purpose ("Necessary only", or unticked under
// "Customize"), the stored device id is sent to DELETE /api/device-check so this device's
// record is erased, then forgotten. Withdrawn while signed out ⇒ it happens on
// the next sign-in.
// ponytail: erases only the signed-in account's row for this device. The id
// is forgotten after that, so other accounts that used this browser keep
// their rows until those accounts are deleted (deliberate: one person's
// choice shouldn't erase other accounts' security records).
export default function DeviceCheck() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  // The fingerprint needs optional-cookie consent (lib/device-fingerprint.ts);
  // re-run when it's granted so the check doesn't wait for the next page load.
  const consent = useCookieConsent()
  const fingerprintAllowed = useConsentFor('fingerprint')

  useEffect(() => {
    if (!userId) return

    // A choice was made (consent !== null) and it excludes the fingerprint.
    if (consent !== null && !fingerprintAllowed) {
      // Re-consenting later in this tab must POST again — the row is gone.
      try {
        sessionStorage.removeItem('device-checked')
      } catch {
        // ignore
      }
      const visitorId = getStoredVisitorId()
      if (!visitorId) return
      fetch('/api/device-check', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      })
        .then((res) => {
          // Keep the id on failure so the next page load retries the erasure.
          if (res.ok) clearStoredVisitorId()
        })
        .catch(() => {})
      return
    }

    if (!fingerprintAllowed) return

    const run = async () => {
      try {
        if (sessionStorage.getItem('device-checked') === userId) return
      } catch {
        // No sessionStorage (private mode etc.) — fall through. The endpoint
        // is idempotent, so the cost is at most one redundant POST per load.
      }

      const visitorId = await getVisitorId()
      if (!visitorId) return

      const res = await fetch('/api/device-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // components: the device's signals for the admin user page.
        body: JSON.stringify({ visitorId, components: await getDeviceSignals() }),
      })
      // Only a success counts as checked — a failed request (server error,
      // deploy in progress) must retry on the next page load, not wait for
      // a new browser session.
      if (!res.ok) return

      try {
        sessionStorage.setItem('device-checked', userId)
      } catch {
        // ignore — see above
      }
    }

    // Best-effort: fingerprinting or the network failing must never surface
    // to the user mid-app.
    run().catch(() => {})
  }, [userId, consent, fingerprintAllowed])

  return null
}
