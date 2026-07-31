import React from 'react'
import Link from 'next/link'
import {
  Card,
  // CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"
import { Separator } from "../ui/separator"
import SocialLogin from './socialLogin'
import EmailPasswordLogin from './emailPasswordLogin'
import EmailPasswordSignup from './emailPasswordSignup'

type Props = {
  authCardTitle: string
  authCardDescription: string
  authCardAction: string
  showSocials: boolean
  showEmailPassword: boolean
  variant?: 'login' | 'signup'
  callbackUrl?: string
}

const authCard = ({ authCardTitle, authCardDescription, showSocials, showEmailPassword, variant = 'login', callbackUrl }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{authCardTitle}</CardTitle>
        <CardDescription>{authCardDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {showSocials && (
          <div>
            <SocialLogin callbackUrl={callbackUrl} />
          </div>
        )}
        {showSocials && showEmailPassword && (
          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OR CONTINUE WITH</span>
            <Separator className="flex-1" />
          </div>
        )}
        {showEmailPassword && (
          variant === 'signup'
            ? <EmailPasswordSignup callbackUrl={callbackUrl} />
            : <EmailPasswordLogin callbackUrl={callbackUrl} />
        )}
      </CardContent>
      {showEmailPassword && (
        <CardFooter className="justify-center text-sm text-muted-foreground">
          {variant === 'signup' ? (
            <p>Already have an account?{' '}
              <Link href="/login" className="underline underline-offset-4">Log in</Link>
            </p>
          ) : (
            <p>Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline underline-offset-4">Sign up</Link>
            </p>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

export default authCard