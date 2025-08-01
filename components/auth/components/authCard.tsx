import React from 'react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import SocialLogin from './socialLogin'

type Props = {
  authCardTitle: string
  authCardDescription: string
  authCardAction: string
  showSocials: boolean
}

const authCard = ({ authCardTitle, authCardDescription, showSocials }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{authCardTitle}</CardTitle>
        <CardDescription>{authCardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {showSocials && (
          <div>
            <SocialLogin />
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