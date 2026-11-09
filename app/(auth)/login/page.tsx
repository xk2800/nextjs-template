import AuthCard from '@/components/auth/authCard'
import { AuthShell } from '@/components/auth/authShell'
import LoginErrorRecovery from '@/components/auth/loginErrorRecovery'
import React from 'react'
import { auth } from "@/server/auth"
import { getEffectiveAuthFlags } from "@/lib/settings-queries"
import { normalizeCallbackUrl } from "@/lib/auth-helpers"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) => {
  // If already logged in, redirect to dashboard or callback URL
  const session = await auth.api.getSession({
    headers: await headers()
  })

  const params = await searchParams
  const callbackUrl = normalizeCallbackUrl(params.callbackUrl)

  if (session?.user) {
    redirect(callbackUrl)
  }

  const authFlags = await getEffectiveAuthFlags()

  return (
    <AuthShell
      headline="Auth, admin and audit — already wired up."
      bullets={[
        "Google OAuth and email sign-in out of the box",
        "Database-backed sessions you can revoke per device",
        "Audit logging and admin impersonation built in",
      ]}
    >
      {params.error && (
        <LoginErrorRecovery error={params.error} callbackUrl={callbackUrl} />
      )}
      <AuthCard
        authCardTitle="Log in"
        authCardDescription="Log in to your account to continue."
        authCardAction="Login"
        showSocials={authFlags.google}
        showEmailPassword={authFlags.emailPassword}
        variant="login"
        callbackUrl={callbackUrl}
      />
    </AuthShell>
  )
}

export default LoginPage