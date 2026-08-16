import Link from 'next/link'
import { AuthShell } from '@/components/auth/authShell'
import ResetPasswordForm from '@/components/auth/resetPasswordForm'
import { Button } from '@/components/ui/button'

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
  searchParams: Promise<{ token?: string; error?: string }>
}) => {
  const { token, error } = await searchParams

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
      </div>
    </AuthShell>
  )
}

export default ResetPasswordPage
