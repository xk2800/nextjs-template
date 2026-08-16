import AuthCard from '@/components/auth/authCard'
import { AuthShell } from '@/components/auth/authShell'
import React from 'react'
import { auth } from "@/server/auth"
import { getEffectiveAuthFlags } from "@/lib/settings-queries"
import { normalizeCallbackUrl } from "@/lib/auth-helpers"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

const SignupPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
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

  // Signup only makes sense for the email/password provider — if it's
  // disabled (at deploy time or live via System Settings), there's nothing
  // to render here.
  if (!authFlags.emailPassword) {
    redirect('/login')
  }

  return (
    <AuthShell
      headline="Auth, admin and audit — already wired up."
      bullets={[
        "Google OAuth and email sign-in out of the box",
        "Database-backed sessions you can revoke per device",
        "Audit logging and admin impersonation built in",
      ]}
    >
      <AuthCard
        authCardTitle="Create your account"
        authCardDescription="Free while you build. No credit card required."
        authCardAction="Sign up"
        showSocials={authFlags.google}
        showEmailPassword={authFlags.emailPassword}
        variant="signup"
        callbackUrl={callbackUrl}
      />
    </AuthShell>
  )
}

export default SignupPage
