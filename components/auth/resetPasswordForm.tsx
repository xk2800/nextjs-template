'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { PasswordInput } from '../ui/password-input'
import { Label } from '../ui/label'
import { authClient } from '../../lib/auth-client'
import { toast } from 'sonner'

type Props = {
  token: string
}

type FieldErrors = {
  password?: string
  confirmPassword?: string
}

const ResetPasswordForm = ({ token }: Props) => {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Matches better-auth's own default minPasswordLength (emailAndPassword
    // config doesn't override it in server/auth.ts) — kept in sync here so
    // the client doesn't accept something the server then rejects.
    const errors: FieldErrors = {}
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    if (errors.password || errors.confirmPassword) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    setIsSubmitting(true)

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (error) {
        toast.error(error.message || 'Failed to reset password')
      } else {
        toast.success('Password reset — log in with your new password')
        router.push('/login')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className={fieldErrors.password ? 'text-destructive' : undefined}>
          New password
        </Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (fieldErrors.password || fieldErrors.confirmPassword) {
              setFieldErrors((prev) => ({ ...prev, password: undefined, confirmPassword: undefined }))
            }
          }}
        />
        {fieldErrors.password && <p id="password-error" className="text-sm text-destructive">{fieldErrors.password}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword" className={fieldErrors.confirmPassword ? 'text-destructive' : undefined}>
          Confirm password
        </Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={!!fieldErrors.confirmPassword}
          aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
          }}
        />
        {fieldErrors.confirmPassword && <p id="confirm-password-error" className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Resetting...' : 'Reset password'}
      </Button>
    </form>
  )
}

export default ResetPasswordForm
