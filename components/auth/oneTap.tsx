'use client'

import { authClient, useSession } from '../../lib/auth-client'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

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

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP !== 'true') return
    if (isPending || session) return

    authClient.oneTap({
      callbackURL,
      onPromptNotification: (notification) => {
        console.log('One Tap prompt notification:', notification)
      }
    })
  }, [session, isPending, callbackURL])

  return null
}

export default OneTap