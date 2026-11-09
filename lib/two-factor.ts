import type { BetterAuthPlugin } from "better-auth"
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api"
import { symmetricDecrypt } from "better-auth/crypto"
import { twoFactor } from "better-auth/plugins"
import { createOTP } from "@better-auth/utils/otp"

// better-auth only challenges 2FA after password sign-ins (/sign-in/email etc.), so a
// user with TOTP on who signs in with Google or One Tap skips it. With challengeAfterOAuth
// these paths get the challenge too. Passkey sign-in isn't: a passkey is already two factors.
const CHALLENGED_PATHS = ["/callback/:id", "/one-tap/callback"]
const CODE_REQUIRED_PATHS = ["/two-factor/disable", "/two-factor/generate-backup-codes"]

export type TwoFactorOptions = {
  /** Shown as the account label in authenticator apps. */
  issuer: string
  /**
   * For apps whose users may have no password (OAuth-only). Enabling 2FA then needs no
   * password, and disabling it or regenerating backup codes needs a current TOTP code
   * (sent as `code` in the body) instead. Default false: the password is required.
   */
  passwordless?: boolean
  /**
   * Also ask for the code after Google and One Tap sign-in, not just password sign-in.
   * The Google callback then redirects to /login/2fa?callbackUrl=…, so the app needs
   * that page. Default false (stock better-auth behaviour).
   */
  challengeAfterOAuth?: boolean
}

/**
 * TOTP 2FA, optionally passwordless and/or also enforced after Google and One Tap sign-in.
 * Returns two plugins; keep them together and in this order in `plugins`.
 */
export function twoFactorPlugins(
  baseURL: string,
  { issuer, passwordless = false, challengeAfterOAuth = false }: TwoFactorOptions,
) {
  const plugin = twoFactor({ issuer, allowPasswordless: passwordless })

  // Reuse the plugin's own challenge hook (drop the new session, set the short-lived
  // 2FA cookie) on the extra paths instead of reimplementing it.
  if (challengeAfterOAuth) {
    const [challenge] = plugin.hooks.after
    plugin.hooks.after = [{
      ...challenge,
      matcher: (ctx) => challenge.matcher(ctx) || CHALLENGED_PATHS.includes(ctx.path ?? ""),
    }]
  }

  const extras = {
    id: "two-factor-extras",
    hooks: {
      // allowPasswordless lets disable / regenerate-backup-codes run on a session alone,
      // so anyone at an unlocked, signed-in browser could switch 2FA off. Require a
      // current authenticator code instead of the password the user doesn't have.
      before: passwordless ? [{
        matcher: (ctx) => CODE_REQUIRED_PATHS.includes(ctx.path ?? ""),
        handler: createAuthMiddleware(async (ctx) => {
          const session = await getSessionFromCtx(ctx)
          if (!session) return // the endpoint rejects it
          const code = (ctx.body as { code?: unknown } | undefined)?.code
          const row = await ctx.context.adapter.findOne<{ secret: string }>({
            model: "twoFactor",
            where: [{ field: "userId", value: session.user.id }],
          })
          const valid =
            typeof code === "string" && !!row &&
            (await createOTP(await symmetricDecrypt({ key: ctx.context.secretConfig, data: row.secret })).verify(code))
          if (!valid) throw new APIError("UNAUTHORIZED", { message: "Enter the current code from your authenticator app" })
        }),
      }] : [],
      // The challenge answers with JSON ({ twoFactorRedirect: true }), which One Tap's
      // caller handles. The Google callback is a browser redirect, so turn it into a
      // redirect to /login/2fa, keeping where the user was headed (same-origin only).
      after: challengeAfterOAuth ? [{
        matcher: (ctx) => ctx.path === "/callback/:id",
        handler: createAuthMiddleware(async (ctx) => {
          const returned = ctx.context.returned as { twoFactorRedirect?: boolean } | undefined
          if (!returned?.twoFactorRedirect) return
          const target = new URL(ctx.context.responseHeaders?.get("location") ?? "/dashboard", baseURL)
          const callbackUrl =
            target.origin === new URL(baseURL).origin ? target.pathname + target.search : "/dashboard"
          throw ctx.redirect(`/login/2fa?callbackUrl=${encodeURIComponent(callbackUrl)}`)
        }),
      }] : [],
    },
  } satisfies BetterAuthPlugin

  return [plugin, extras] as const
}
