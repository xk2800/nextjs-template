'use client'

import React, { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { PasswordInput } from '../ui/password-input'
import { Label } from '../ui/label'
import { authClient } from '../../lib/auth-client'
import { LOGIN_REFERRER_COOKIE } from '../../lib/cookie-names'
import { SignupSchema } from '../../types/auth/signupSchema'
import { toast } from 'sonner'

type Props = {
  callbackUrl?: string
}

// Matches better-auth's own default minPasswordLength (server/auth.ts
// doesn't override it) — the meter below is UX guidance, not the source of
// truth for what the server will actually accept.
const MIN_PASSWORD_LENGTH = 8

function getPasswordStrength(password: string): number {
  if (password.length === 0) return 0
  let score = 0
  if (password.length >= MIN_PASSWORD_LENGTH) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++
  return score
}

const STRENGTH_LABEL = ['', 'Weak', 'Weak', 'Good', 'Strong']
const STRENGTH_COLOR = ['bg-muted', 'bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-green-500']

const EmailPasswordSignup = ({ callbackUrl }: Props) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const strength = useMemo(() => getPasswordStrength(password), [password])

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
          placeholder="Ada Lovelace"
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
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {[1, 2, 3, 4].map((segment) => (
              <span
                key={segment}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  segment <= strength ? STRENGTH_COLOR[strength] : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {password.length < MIN_PASSWORD_LENGTH ? `Use ${MIN_PASSWORD_LENGTH}+ characters` : STRENGTH_LABEL[strength]}
          </span>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  )
}

export default EmailPasswordSignup
