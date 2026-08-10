'use client'

import { Button } from '../ui/button'
import { FcGoogle } from "react-icons/fc";
import React from 'react'
import { authClient } from "../../lib/auth-client";
import { LOGIN_REFERRER_COOKIE } from "../../lib/cookie-names";
import { toast } from 'sonner'

type Props = {
  callbackUrl?: string
}

const SocialLogin = ({ callbackUrl }: Props) => {
  const handleGoogleSignIn = async () => {
    // The OAuth round trip through Google means the server only sees
    // accounts.google.com as the referer on the callback request — stash
    // the actual page here, before we redirect away, so the login-activity
    // log can show where the user really came from (read back via
    // getCookie in server/auth.ts's session.create hook).
    document.cookie = `${LOGIN_REFERRER_COOKIE}=${encodeURIComponent(window.location.href)}; path=/; max-age=300; samesite=lax`

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl || "/dashboard"
      })

      if (error) {
        toast.error(error.message || 'Failed to sign in with Google')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in with Google')
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
      >
        <div className="flex items-center gap-1"><FcGoogle /> Sign in with Google</div>
      </Button>
    </div>
  )
}

export default SocialLogin
