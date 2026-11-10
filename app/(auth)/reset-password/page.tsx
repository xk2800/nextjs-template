import Link from 'next/link'
import { AuthShell } from '@/components/auth/authShell'
import ResetPasswordForm from '@/components/auth/resetPasswordForm'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import SocialLogin from '@/components/auth/socialLogin'
import { getEffectiveAuthFlags } from '@/lib/settings-queries'

const BULLETS = [
  "Google OAuth and email sign-in out of the box",
  "Database-backed sessions you can revoke per device",
  "Audit logging and admin impersonation built in",
]

// better-auth redirects here itself after validating the emailed link —
// see server/auth.ts's sendResetPassword and forgotPasswordForm.tsx's
// redirectTo. `token` is only present when the link was valid and unexpired;
// otherwise better-auth appends `error=INVALID_TOKEN` instead.
const ResetPasswordPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; invite?: string }>
}) => {
  const { token, error, invite } = await searchParams

  if (!token || error) {
    return (
      <AuthShell headline="Auth, admin and audit — already wired up." bullets={BULLETS}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Link expired</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This password reset link is invalid or has expired. Request a new one to continue.
          </p>
          <Button asChild className="mt-8 w-full">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  // Admin invites (see app/api/admin/users/invite) may skip the password and
  // sign in with Google instead; the account links on the matching email.
  const showGoogle = invite === '1' && (await getEffectiveAuthFlags()).google

  return (
    <AuthShell headline="Auth, admin and audit — already wired up." bullets={BULLETS}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>
        <div className="mt-8">
          <ResetPasswordForm token={token} />
        </div>
        {showGoogle && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>
            <SocialLogin />
          </div>
        )}
      </div>
    </AuthShell>
  )
}

export default ResetPasswordPage
