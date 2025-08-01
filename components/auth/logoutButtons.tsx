'use client'

import React from 'react'
import { signOut } from "next-auth/react";
import { Button } from '../ui/button';


const LogoutButtons = () => {
  return (
    <div>
      <Button onClick={() => signOut()}>Logout</Button>
    </div>
  )
}

export default LogoutButtons