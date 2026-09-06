'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '../../lib/auth-client'

type Props = {
  /** The `?error=` code better-auth redirected to /login with. */
  error: string
  /** Already normalized server-side (lib/auth-helpers is server-only). */
  callbackUrl: string
}

// better-auth throws these from parseState when the one-time OAuth `state` row
// is missing at callback time — almost always because the callback URL got hit
// twice (browser Back after Google's no-consent redirect, bfcache replay,
// prefetch, double-nav — better-auth#5658 / #6544). The first hit logs the user
// in; the second lands here. Recoverable: wait for the winning request's
// session cookie to land, then continue — or restart the flow once.
const TRANSIENT = new Set([
  'please_restart_the_process',
  'state_mismatch',
  'state_not_found',
])

// Only one auto-restart per tab session, so a genuinely broken OAuth config
// can't bounce the user login → Google → login forever.
const RETRY_GUARD_KEY = 'login-oauth-retried'

const FRIENDLY: Record<string, string> = {
  account_banned: 'This account has been suspended.',
  account_not_linked:
    'An account with this email already exists. Sign in with your original method, then link Google from settings.',
}

export default function LoginErrorRecovery({ error, callbackUrl }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [recovering, setRecovering] = useState(TRANSIENT.has(error))

  useEffect(() => {
    if (!TRANSIENT.has(error)) {
      setMessage(FRIENDLY[error] ?? 'Sign-in was interrupted. Please try again.')
      return
    }

    let cancelled = false

    const hasSession = async () => {
      const { data } = await authClient.getSession()
      return Boolean(data?.user)
    }

    const run = async () => {
      // The losing request usually beats the winning request's Set-Cookie to
      // the browser — give it a moment, then re-check.
      let authed = await hasSession()
      if (!authed) {
        await new Promise((r) => setTimeout(r, 1200))
        authed = await hasSession()
      }
      if (cancelled) return

      if (authed) {
        try {
          sessionStorage.removeItem(RETRY_GUARD_KEY)
        } catch {
          // no sessionStorage (private mode) — nothing to clear
        }
        router.replace(callbackUrl)
        return
      }

      let alreadyRetried = false
      try {
        alreadyRetried = sessionStorage.getItem(RETRY_GUARD_KEY) === '1'
        sessionStorage.setItem(RETRY_GUARD_KEY, '1')
      } catch {
        // no sessionStorage — fall through and allow the single retry
      }
      if (cancelled) return

      if (alreadyRetried) {
        setRecovering(false)
        setMessage("Sign-in didn't complete. Please try again.")
        return
      }

      // Fresh flow, fresh `state` row.
      await authClient.signIn.social({ provider: 'google', callbackURL: callbackUrl })
    }

    run().catch(() => {
      if (cancelled) return
      setRecovering(false)
      setMessage("Sign-in didn't complete. Please try again.")
    })

    return () => {
      cancelled = true
    }
  }, [error, callbackUrl, router])

  if (recovering) {
    return (
      <p className="mb-4 text-sm text-muted-foreground" role="status">
        Reconnecting your session…
      </p>
    )
  }

  if (message) {
    return <p className="mb-4 text-sm text-destructive">{message}</p>
  }

  return null
}
