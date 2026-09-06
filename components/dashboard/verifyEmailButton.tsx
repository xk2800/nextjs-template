'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { authClient } from '../../lib/auth-client'

export default function VerifyEmailButton({ email }: { email: string }) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function send() {
    setSending(true)
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: '/dashboard',
    })
    setSending(false)
    if (error) {
      toast.error(error.message || 'Could not send verification email')
      return
    }
    setSent(true)
    toast.success('Verification email sent — check your inbox')
  }

  return (
    <Button size="sm" variant="outline" onClick={send} disabled={sending || sent}>
      {sent ? 'Email sent' : sending ? 'Sending…' : 'Verify email'}
    </Button>
  )
}
