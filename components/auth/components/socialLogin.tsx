'use client'

import { Button } from '@/components/ui/button'
import { FcGoogle } from "react-icons/fc";
import React from 'react'
import { authClient } from "@/lib/auth-client";

type Props = {
  callbackUrl?: string
}

const SocialLogin = ({ callbackUrl }: Props) => {
  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: callbackUrl || "/dashboard"
    })
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
