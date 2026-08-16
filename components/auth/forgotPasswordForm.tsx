'use client'

import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { authClient } from '../../lib/auth-client'
import { toast } from 'sonner'

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await authClient.forgetPassword({
        email,
        redirectTo: '/reset-password',
      })

      if (error) {
        toast.error(error.message || 'Failed to send reset email')
      } else {
        setSent(true)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset email')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        If an account exists for <span className="font-medium text-foreground">{email}</span>, we&apos;ve
        sent a link to reset your password. It expires in an hour.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send reset link'}
      </Button>
    </form>
  )
}

export default ForgotPasswordForm
