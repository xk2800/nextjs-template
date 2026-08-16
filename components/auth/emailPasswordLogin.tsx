'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { PasswordInput } from '../ui/password-input'
import { Label } from '../ui/label'
import { authClient } from '../../lib/auth-client'
import { LOGIN_REFERRER_COOKIE } from '../../lib/cookie-names'
import { LoginSchema } from '../../types/auth/loginSchema'
import { toast } from 'sonner'

type Props = {
  callbackUrl?: string
}

const EmailPasswordLogin = ({ callbackUrl }: Props) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = LoginSchema.safeParse({ email, password })
    if (!result.success) {
      toast.error(result.error.issues[0]?.message || 'Invalid email or password')
      return
    }

    setIsSubmitting(true)

    // Overwrite any stale value left by an abandoned social sign-in attempt
    // (see socialLogin.tsx) — this request's own referer header is already
    // correct for email/password, but the login-activity log always prefers
    // the cookie when present, so it needs to reflect this flow instead.
    document.cookie = `${LOGIN_REFERRER_COOKIE}=${encodeURIComponent(window.location.href)}; path=/; max-age=300; samesite=lax`

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: callbackUrl || '/dashboard',
      })

      if (error) {
        toast.error(error.message || 'Failed to sign in')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in')
    } finally {
      setIsSubmitting(false)
    }
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
        // required
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        // required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}

export default EmailPasswordLogin
