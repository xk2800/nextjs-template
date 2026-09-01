'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { z } from 'zod'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { PasswordInput } from '../ui/password-input'
import { Label } from '../ui/label'
import { authClient } from '../../lib/auth-client'
import { getVisitorId } from '../../lib/device-fingerprint'
import { LOGIN_REFERRER_COOKIE, DEVICE_FINGERPRINT_HEADER } from '../../lib/cookie-names'
import { LoginSchema } from '../../types/auth/loginSchema'
import { toast } from 'sonner'

type Props = {
  callbackUrl?: string
}

// Derived from the schema (not hand-typed) so a field rename/add/remove
// there can't silently drift out of sync with the error state's shape here.
type FieldErrors = Partial<Record<keyof z.infer<typeof LoginSchema>, string>>

const EmailPasswordLogin = ({ callbackUrl }: Props) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  // Warm the fingerprint cache so the first sign-in submit doesn't wait on it.
  useEffect(() => {
    void getVisitorId()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = LoginSchema.safeParse({ email, password })
    if (!result.success) {
      const formatted = z.flattenError(result.error).fieldErrors
      setFieldErrors({
        email: formatted.email?.[0],
        password: formatted.password?.[0],
      })
      return
    }
    setFieldErrors({})

    setIsSubmitting(true)

    // Overwrite any stale value left by an abandoned social sign-in attempt
    // (see socialLogin.tsx) — this request's own referer header is already
    // correct for email/password, but the login-activity log always prefers
    // the cookie when present, so it needs to reflect this flow instead.
    document.cookie = `${LOGIN_REFERRER_COOKIE}=${encodeURIComponent(window.location.href)}; path=/; max-age=300; samesite=lax`

    try {
      const visitorId = await getVisitorId()
      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: callbackUrl || '/dashboard',
        fetchOptions: visitorId
          ? { headers: { [DEVICE_FINGERPRINT_HEADER]: visitorId } }
          : undefined,
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
        <Label htmlFor="email" className={fieldErrors.email ? 'text-destructive' : undefined}>
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }))
          }}
        />
        {fieldErrors.email && <p id="email-error" className="text-sm text-destructive">{fieldErrors.email}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className={fieldErrors.password ? 'text-destructive' : undefined}>
            Password
          </Label>
          <Link href="/forgot-password" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }))
          }}
        />
        {fieldErrors.password && <p id="password-error" className="text-sm text-destructive">{fieldErrors.password}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}

export default EmailPasswordLogin
