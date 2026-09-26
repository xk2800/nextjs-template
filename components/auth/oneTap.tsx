'use client'

import { authClient, useSession } from '../../lib/auth-client'
import { useCookieConsent } from '../../lib/cookie-consent'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

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
  // it only loads once the visitor accepts optional cookies.
  const consent = useCookieConsent()

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
    if (consent !== 'all') return

    authClient.oneTap({
      callbackURL,
      onPromptNotification: (notification) => {
        console.log('One Tap prompt notification:', notification)
      }
    })
  }, [session, isPending, callbackURL, oneTapOffered, consent])

  return null
}

export default OneTap