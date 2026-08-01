import AuthCard from '@/components/auth/authCard'
import React from 'react'
import { auth } from "@/server/auth"
import { config } from "@/config/env"
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

  // Signup only makes sense for the email/password provider — if it's
  // disabled in this project, there's nothing to render here.
  if (!config.AUTH_ENABLE_EMAIL_PASSWORD) {
    redirect('/login')
  }

  return (
    <div className="max-w-4xl mx-auto mt-12">
      <AuthCard
        authCardTitle="Sign up"
        authCardDescription="Create a new account"
        authCardAction="Sign up"
        showSocials={config.AUTH_ENABLE_GOOGLE}
        showEmailPassword={config.AUTH_ENABLE_EMAIL_PASSWORD}
        variant="signup"
        callbackUrl={callbackUrl}
      />
    </div>
  )
}

export default SignupPage
