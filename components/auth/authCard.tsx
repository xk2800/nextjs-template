import Link from 'next/link'
import { Separator } from "../ui/separator"
import SocialLogin from './socialLogin'
import EmailPasswordLogin from './emailPasswordLogin'
import EmailPasswordSignup from './emailPasswordSignup'
import PasskeyLogin from './passkeyLogin'

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
  const toggleHref = callbackUrl
    ? `${variant === 'signup' ? '/login' : '/signup'}?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : variant === 'signup'
      ? '/login'
      : '/signup'

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{authCardTitle}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{authCardDescription}</p>

      <div className="mt-8 flex flex-col gap-4">
        {showSocials && (
          <div>
            <SocialLogin
              callbackUrl={callbackUrl}
              label={variant === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
            />
          </div>
        )}
        {showSocials && showEmailPassword && (
          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <Separator className="flex-1" />
          </div>
        )}
        {showEmailPassword && (
          variant === 'signup'
            ? <EmailPasswordSignup callbackUrl={callbackUrl} />
            : <EmailPasswordLogin callbackUrl={callbackUrl} />
        )}

        {variant === 'login' && (
          <>
            {(showSocials || showEmailPassword) && (
              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>
            )}
            <PasskeyLogin callbackUrl={callbackUrl} />
          </>
        )}
      </div>

      {showEmailPassword && variant === 'signup' && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to the{' '}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>.
        </p>
      )}

      {showEmailPassword && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {variant === 'signup' ? (
            <>Already have an account?{' '}
              <Link href={toggleHref} className="font-medium text-foreground underline underline-offset-4">Log in</Link>
            </>
          ) : (
            <>Don&apos;t have an account?{' '}
              <Link href={toggleHref} className="font-medium text-foreground underline underline-offset-4">Sign up</Link>
            </>
          )}
        </p>
      )}
    </div>
  )
}

export default authCard
