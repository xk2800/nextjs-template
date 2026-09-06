import React from 'react'
import { AuthShell } from '@/components/auth/authShell'
import TwoFactorVerifyForm from '@/components/auth/twoFactorVerifyForm'
import { normalizeCallbackUrl } from '@/lib/auth-helpers'

const TwoFactorPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) => {
  const params = await searchParams
  const callbackUrl = normalizeCallbackUrl(params.callbackUrl)

  return (
    <AuthShell
      headline="One more step."
      bullets={[
        'Your account is protected with two-factor authentication',
        'Enter a code from your authenticator app or a backup code',
        'Trust this device to skip this next time',
      ]}
    >
      <TwoFactorVerifyForm callbackUrl={callbackUrl} />
    </AuthShell>
  )
}

export default TwoFactorPage
