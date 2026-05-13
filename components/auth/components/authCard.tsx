import React from 'react'
import {
  Card,
  // CardAction,
  CardContent,
  CardDescription,
  // CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import SocialLogin from './socialLogin'

type Props = {
  authCardTitle: string
  authCardDescription: string
  authCardAction: string
  showSocials: boolean
  callbackUrl?: string
}

const authCard = ({ authCardTitle, authCardDescription, showSocials, callbackUrl }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{authCardTitle}</CardTitle>
        <CardDescription>{authCardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {showSocials && (
          <div>
            <SocialLogin callbackUrl={callbackUrl} />
          </div>
        )}
      </CardContent>
      {/* <CardFooter>
        <p></p>
      </CardFooter> */}
    </Card>
  )
}

export default authCard