import AuthCard from '@/components/auth/components/authCard'
import React from 'react'


type Props = {}

const page = (props: Props) => {
  return (
    <div className="max-w-4xl mx-auto">
      <AuthCard authCardTitle="Login" authCardDescription="Login to your account" authCardAction="Login" showSocials />
    </div>
  )
}

export default page