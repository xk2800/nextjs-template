'use client'

import React from 'react'
import { authClient } from "../../lib/auth-client";
import { Button } from '../ui/button';


const LogoutButtons = () => {
  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/"
        }
      }
    })
  }

  return (
    <div>
      <Button onClick={handleSignOut}>Logout</Button>
    </div>
  )
}

export default LogoutButtons
