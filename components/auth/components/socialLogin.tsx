'use client'

import { Button } from '@/components/ui/button'
import { FcGoogle } from "react-icons/fc";
import React from 'react'
import { signIn } from "next-auth/react";

const SocialLogin = () => {
  return (
    <div>
      <Button
        variant="outline"
        className="w-full"
        onClick={
          () => signIn('google',
            {
              callbackUrl: '/'
            })
        }
      >
        <div className="flex items-center gap-1"><FcGoogle /> Sign in with Google</div>
      </Button>
    </div>
  )
}

export default SocialLogin