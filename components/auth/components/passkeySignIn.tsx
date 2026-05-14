'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'

type Props = {
  callbackUrl?: string
}

export default function PasskeySignIn({ callbackUrl }: Props) {
  const router = useRouter()
  // Render nothing on browsers that don't support WebAuthn rather than showing a broken button
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // Ref (not state) prevents React Strict Mode's double-effect from launching two
  // concurrent conditional mediation requests, which would cause a browser error
  const autofillStarted = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) return
    setIsSupported(true)

    if (!autofillStarted.current && PublicKeyCredential.isConditionalMediationAvailable) {
      autofillStarted.current = true
      PublicKeyCredential.isConditionalMediationAvailable().then((available) => {
        if (!available) return
        // autoFill: true starts a long-lived WebAuthn request that resolves only if
        // the browser surfaces a passkey through its autofill/password-manager UI.
        // It runs silently in the background — the user sees no prompt until they
        // interact with an autocomplete field.
        authClient.signIn.passkey({ autoFill: true }).then((result) => {
          if (result && !result.error) {
            router.push(callbackUrl || '/dashboard')
            router.refresh()
          }
        })
      })
    }
  }, [callbackUrl, router])

  if (!isSupported) return null

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      const result = await authClient.signIn.passkey()
      if (result?.error) {
        toast.error(result.error.message || 'Failed to sign in with passkey')
      } else {
        router.push(callbackUrl || '/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('Failed to sign in with passkey')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleSignIn}
      disabled={isLoading}
    >
      <KeyRound className="h-4 w-4 mr-2" />
      {isLoading ? 'Signing in...' : 'Sign in with Passkey'}
    </Button>
  )
}
