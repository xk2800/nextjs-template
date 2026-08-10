import AuthCard from '@/components/auth/authCard'
import React from 'react'
import { auth } from "@/server/auth"
import { getEffectiveAuthFlags } from "@/lib/settings-queries"
import { normalizeCallbackUrl } from "@/lib/auth-helpers"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

const LoginPage = async ({
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

  return (
    <div className="max-w-4xl mx-auto mt-12">
      <AuthCard
        authCardTitle="Login"
        authCardDescription="Login to your account"
        authCardAction="Login"
        showSocials={authFlags.google}
        showEmailPassword={authFlags.emailPassword}
        variant="login"
        callbackUrl={callbackUrl}
      />
    </div>
  )
}

export default LoginPage