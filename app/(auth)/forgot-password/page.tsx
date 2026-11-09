import Link from 'next/link'
import { AuthShell } from '@/components/auth/authShell'
import ForgotPasswordForm from '@/components/auth/forgotPasswordForm'
import { auth } from '@/server/auth'
import { getEffectiveAuthFlags } from '@/lib/settings-queries'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const ForgotPasswordPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (session?.user) {
    redirect('/dashboard')
  }

  // Password reset only makes sense when email/password sign-in itself is
  // enabled — same gate signup uses for the same reason.
  const authFlags = await getEffectiveAuthFlags()
  if (!authFlags.emailPassword) {
    redirect('/login')
  }

  return (
    <AuthShell
      headline="Auth, admin and audit — already wired up."
      bullets={[
        "Google OAuth and email sign-in out of the box",
        "Database-backed sessions you can revoke per device",
        "Audit logging and admin impersonation built in",
      ]}
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to get back in.
        </p>
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Back to login
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

export default ForgotPasswordPage
