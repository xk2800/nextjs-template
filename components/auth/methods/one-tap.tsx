'use client'

import { authClient, useSession } from '../../../lib/auth/client'
import { useConsentFor } from '../../../lib/security/cookie-consent'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

type OneTapProps = {
  /**
   * Where Better-Auth redirects after a successful One Tap sign-in.
   * @default "/dashboard"
   */
  callbackURL?: string
}

const OneTap = ({ callbackURL = '/dashboard' }: OneTapProps) => {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  // NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP (build-time) decides whether the plugin
  // exists in the bundle at all — unchanged. This is the separate, live
  // on/off switch from the System Settings page: null while unknown, so we
  // never fire the prompt before we've actually heard back.
  const [oneTapOffered, setOneTapOffered] = useState<boolean | null>(null)
  // Google's One Tap script is third-party and can use Google's cookies, so
  // it only loads once the visitor consents to the "onetap" purpose.
  const oneTapAllowed = useConsentFor('onetap')
  // Refs survive React strict mode's dev double-effect; a second prompt() aborts the first and GSI logs it as a console error.
  const prompted = useRef(false)

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP !== 'true') return

    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => setOneTapOffered(Boolean(data.oneTapEnabled)))
      // Fail closed — never nag a user with a prompt an admin just disabled.
      .catch(() => setOneTapOffered(false))
  }, [])

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP !== 'true') return
    if (isPending || session) return
    if (oneTapOffered !== true) return
    if (!oneTapAllowed) return
    if (prompted.current) return
    prompted.current = true

    // Passing fetchOptions (and no callbackURL) turns off the client's own redirect, so
    // a 2FA challenge ({ twoFactorRedirect }) isn't overwritten by a jump to callbackURL.
    authClient.oneTap({
      fetchOptions: {
        onSuccess: ({ data }) => {
          window.location.href = (data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect
            ? `/login/2fa?callbackUrl=${encodeURIComponent(callbackURL)}`
            : callbackURL
        },
      },
      // No onPromptNotification: it makes GSI call the display/skipped-moment methods, which FedCM deprecates.
    })
  }, [session, isPending, callbackURL, oneTapOffered, oneTapAllowed])

  return null
}

export default OneTap