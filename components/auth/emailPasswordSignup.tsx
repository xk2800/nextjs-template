'use client'

import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { authClient } from '../../lib/auth-client'
import { LOGIN_REFERRER_COOKIE } from '../../lib/cookie-names'
import { SignupSchema } from '../../types/auth/signupSchema'
import { toast } from 'sonner'

type Props = {
  callbackUrl?: string
}

const EmailPasswordSignup = ({ callbackUrl }: Props) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = SignupSchema.safeParse({ name, email, password })
    if (!result.success) {
      toast.error(result.error.issues[0]?.message || 'Invalid signup details')
      return
    }

    setIsSubmitting(true)

    // See emailPasswordLogin.tsx — keeps this cookie fresh for this flow so
    // the login-activity log doesn't pick up a stale value from an
    // abandoned social sign-in attempt.
    document.cookie = `${LOGIN_REFERRER_COOKIE}=${encodeURIComponent(window.location.href)}; path=/; max-age=300; samesite=lax`

    try {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: callbackUrl || '/dashboard',
      })

      if (error) {
        toast.error(error.message || 'Failed to sign up')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign up')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing up...' : 'Sign up'}
      </Button>
    </form>
  )
}

export default EmailPasswordSignup
