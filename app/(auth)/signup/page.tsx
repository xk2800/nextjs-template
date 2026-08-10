import AuthCard from '@/components/auth/authCard'
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
    <div className="max-w-4xl mx-auto mt-12">
      <AuthCard
        authCardTitle="Sign up"
        authCardDescription="Create a new account"
        authCardAction="Sign up"
        showSocials={authFlags.google}
        showEmailPassword={authFlags.emailPassword}
        variant="signup"
        callbackUrl={callbackUrl}
      />
    </div>
  )
}

export default SignupPage
