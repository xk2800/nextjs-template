'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import { authClient } from '../../lib/auth-client'
import { toast } from 'sonner'

type Props = {
  callbackUrl: string
}

// Second-factor challenge, shown after a correct password when the account
// has TOTP enabled. `signIn.email` returns `twoFactorRedirect: true` instead
// of a session and sets a short-lived cookie; verifying here finalizes it.
const TwoFactorVerifyForm = ({ callbackUrl }: Props) => {
  const router = useRouter()
  const [mode, setMode] = useState<'totp' | 'backup'>('totp')
  const [code, setCode] = useState('')
  const [trustDevice, setTrustDevice] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return

    setIsSubmitting(true)
    try {
      const { error } =
        mode === 'totp'
          ? await authClient.twoFactor.verifyTotp({ code: trimmed, trustDevice })
          : await authClient.twoFactor.verifyBackupCode({ code: trimmed, trustDevice })

      if (error) {
        toast.error(error.message || 'Invalid code')
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify code')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Two-factor authentication</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === 'totp'
          ? 'Enter the 6-digit code from your authenticator app.'
          : 'Enter one of your backup codes.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">{mode === 'totp' ? 'Authenticator code' : 'Backup code'}</Label>
          <Input
            id="code"
            inputMode={mode === 'totp' ? 'numeric' : 'text'}
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={trustDevice}
            onCheckedChange={(v) => setTrustDevice(v === true)}
          />
          Trust this device for 30 days
        </label>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying...' : 'Verify'}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === 'totp' ? 'backup' : 'totp'))
          setCode('')
        }}
        className="mt-6 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        {mode === 'totp' ? 'Use a backup code instead' : 'Use your authenticator app instead'}
      </button>
    </div>
  )
}

export default TwoFactorVerifyForm
