'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { Button } from '../ui/button'
import { authClient } from '../../lib/auth-client'
import { toast } from 'sonner'

type Props = {
  callbackUrl?: string
}

// Passwordless sign-in with a passkey registered from the Settings page.
const PasskeyLogin = ({ callbackUrl }: Props) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClick = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await authClient.signIn.passkey()
      if (error) {
        toast.error(error.message || 'Passkey sign-in failed')
        return
      }
      router.push(callbackUrl || '/dashboard')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Passkey sign-in failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleClick}
      disabled={isSubmitting}
    >
      <KeyRound className="size-4" />
      {isSubmitting ? 'Waiting for passkey...' : 'Sign in with a passkey'}
    </Button>
  )
}

export default PasskeyLogin
