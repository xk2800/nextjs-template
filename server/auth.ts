import "server-only"
import { betterAuth, type BetterAuthOptions } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq, sql } from "drizzle-orm"
import { db } from "./db"
import { users, accounts, sessions, verifications, twoFactors, passkeys } from "./db/schema"
import { config } from "@/config/env"
import bcrypt from 'bcrypt'
import { oneTap, admin as adminPlugin, twoFactor } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { createAuthMiddleware, getSessionFromCtx, APIError } from "better-auth/api"
import { logActivity } from "@/lib/activity-logger"
import { getClientIp, parseUserAgent, lookupGeoLocation, formatDeviceInfo, formatLocation } from "@/lib/request-info"
import { LOGIN_REFERRER_COOKIE, DEVICE_FINGERPRINT_HEADER } from "@/lib/cookie-names"
import { isDeviceThrottled, recordDeviceAttempt, clearDeviceThrottle } from "@/lib/auth-throttle"
import { MAX_IP } from "@/lib/auth-throttle-limits"
import { getEffectiveAuthFlags } from "@/lib/settings-queries"
import { getResend, EMAIL_FROM } from "@/lib/resend"
import { EmailTemplateResetPassword } from "@/components/email/email-template-reset-password"
import { EmailTemplateVerifyEmail } from "@/components/email/email-template-verify-email"
import { EmailTemplatePasskeyChange } from "@/components/email/email-template-passkey-change"

type AuthOverrides = {
  // Merged with (not replacing) the default `google` provider below, so
  // consuming projects can add e.g. `apple` without forking this file.
  socialProviders?: BetterAuthOptions["socialProviders"]
}

// A failed credential sign-in, written to the activity feed — but only when
// the attempted email maps to a real account (activityLogs.userId is NOT
// NULL, and a miss has no user to attribute the row to). Best-effort: runs
// in an after-hook and must never disturb the sign-in response.
async function logFailedLogin(ctx: { body?: unknown; headers?: Headers | null }) {
  try {
    const raw = (ctx.body as { email?: unknown } | undefined)?.email
    const email = typeof raw === "string" ? raw.toLowerCase() : null
    if (!email) return

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    if (!user) return

    await logActivity({
      userId: user.id,
      action: "login_failed",
      description: "Failed login attempt",
      ipAddress: getClientIp(ctx.headers),
      userAgent: ctx.headers?.get("user-agent") ?? null,
    })
  } catch (error) {
    console.error("Failed to log login_failed activity", error)
  }
}

// Email the account owner that a passkey was added or removed. Runs from the
// auth `after` hook on a successful /passkey/verify-registration or
// /passkey/delete-passkey; best-effort — a mail failure must not fail the
// endpoint. Also written to the activity feed. Self-disables when Resend
// isn't configured.
async function notifyPasskeyChange(
  ctx: Parameters<Parameters<typeof createAuthMiddleware>[0]>[0],
  action: "added" | "removed",
) {
  try {
    const session = await getSessionFromCtx(ctx)
    const user = session?.user
    if (!user) return

    const ip = getClientIp(ctx.headers)

    await logActivity({
      userId: user.id,
      action: action === "added" ? "passkey_added" : "passkey_removed",
      description: `Passkey ${action}`,
      ipAddress: ip,
      userAgent: ctx.headers?.get("user-agent") ?? null,
    })

    if (!config.RESEND_API_KEY) return

    await getResend().emails.send({
      from: EMAIL_FROM,
      to: [user.email],
      subject: action === "added" ? "A passkey was added to your account" : "A passkey was removed from your account",
      react: EmailTemplatePasskeyChange({
        firstName: user.name || "there",
        action,
        device: formatDeviceInfo(parseUserAgent(ctx.headers?.get("user-agent") ?? null)),
        location: formatLocation(lookupGeoLocation(ip)),
        ipAddress: ip || "Unknown",
        when: new Date().toUTCString(),
        manageUrl: `${process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard/settings`,
      }),
    })
  } catch (error) {
    console.error("Failed to send passkey-change notification", error)
  }
}

export function createAuth(overrides: AuthOverrides = {}) {
  const socialProviders: NonNullable<BetterAuthOptions["socialProviders"]> = {
    ...(config.AUTH_ENABLE_GOOGLE ? {
      google: {
        clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
      },
    } : {}),
    ...overrides.socialProviders,
  }
  const emailAndPasswordEnabled = config.AUTH_ENABLE_EMAIL_PASSWORD

  // Guard on the *final* merged config, after overrides.socialProviders is applied —
  // this only fails when there's truly no way to sign in. A project that disables both
  // built-ins via AUTH_ENABLE_GOOGLE=false / AUTH_ENABLE_EMAIL_PASSWORD=false but adds
  // its own provider (e.g. apple) here is a valid config and won't trip this.
  const hasEnabledSocialProvider = Object.values(socialProviders).some(Boolean)

  if (!hasEnabledSocialProvider && !emailAndPasswordEnabled) {
    throw new Error(
      "No auth provider is enabled — every social provider is off and emailAndPassword.enabled is false. " +
      "Enable AUTH_ENABLE_GOOGLE / AUTH_ENABLE_EMAIL_PASSWORD, or pass your own provider via createAuth({ socialProviders: {...} })."
    )
  }

  // Shared by the `baseURL` field below and the passkey plugin's rpID/origin
  // — WebAuthn credentials are bound to this exact origin, so it must never
  // fall back to better-auth's own "localhost" passkey default in production.
  const baseURL = process.env.NEXTAUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000"

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: users,
        account: accounts,
        session: sessions,
        verification: verifications,
        twoFactor: twoFactors,
        passkey: passkeys,
      },
    }),

    // Session configuration (30 days expiration matching previous NextAuth setup)
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // Update session every 24 hours
      cookieCache: {
        enabled: true, // Enable hybrid session caching for performance
        maxAge: 5 * 60, // 5 minutes
      }
    },

    // Email & Password Authentication (replaces Credentials provider)
    // Toggle per-project via AUTH_ENABLE_EMAIL_PASSWORD in that project's own .env.*
    emailAndPassword: {
      enabled: emailAndPasswordEnabled,
      requireEmailVerification: false,
      // Use bcrypt to maintain compatibility with existing user passwords
      async hash(password: string) {
        return await bcrypt.hash(password, 10);
      },
      async verify({ hash, password }: { hash: string, password: string }) {
        return await bcrypt.compare(password, hash);
      },
      // `url` is fully composed by better-auth (baseURL + verification token +
      // callbackURL) — see app/(auth)/forgot-password and reset-password for
      // the pages this points at.
      async sendResetPassword({ user, url }) {
        await getResend().emails.send({
          from: EMAIL_FROM,
          to: [user.email],
          subject: "Reset your password",
          react: EmailTemplateResetPassword({ firstName: user.name || "there", url }),
        })
      },
    },

    // Email verification. `requireEmailVerification` above stays false, so this
    // is opt-in: users trigger it from the dashboard via
    // authClient.sendVerificationEmail(). better-auth composes `url`
    // (baseURL + token + callbackURL) and serves the /api/auth/verify-email
    // callback that flips users.emailVerified on click.
    emailVerification: {
      autoSignInAfterVerification: true,
      async sendVerificationEmail({ user, url }) {
        await getResend().emails.send({
          from: EMAIL_FROM,
          to: [user.email],
          subject: "Confirm your email",
          react: EmailTemplateVerifyEmail({ firstName: user.name || "there", url }),
        })
      },
    },

    // Social Providers — google is included by default; toggle per-project via
    // AUTH_ENABLE_GOOGLE. overrides.socialProviders can still add more (or replace it).
    socialProviders,

    // User schema configuration
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          input: false, // Prevent users from setting their own role
        },
      },
    },

    // Advanced options
    advanced: {
      generateId: () => require('@paralleldrive/cuid2').createId(),
    },

    // Every new session row corresponds to a sign-in (credential or OAuth) —
    // use that as the "last logged in" signal rather than session updates,
    // which also fire on cookie-cache refresh / expiry extension.
    databaseHooks: {
      session: {
        create: {
          async after(session, context) {
            // Impersonation sessions (created by the admin plugin's
            // impersonateUser endpoint) also go through session.create —
            // don't let "an admin looked at this account" show up as the
            // user's own last login, and log it as an audit event instead.
            const impersonatedBy = (session as { impersonatedBy?: string | null }).impersonatedBy
            if (impersonatedBy) {
              const target = await db
                .select({ email: users.email })
                .from(users)
                .where(eq(users.id, session.userId))
                .limit(1)

              await logActivity({
                userId: impersonatedBy,
                action: 'impersonation_started',
                description: `Admin started impersonating ${target[0]?.email ?? session.userId}`,
                metadata: { impersonatedUserId: session.userId },
              })
              return
            }

            try {
              await db
                .update(users)
                .set({ lastLoginAt: new Date() })
                .where(eq(users.id, session.userId))
            } catch (error) {
              console.error("Failed to update lastLoginAt", error)
            }

            try {
              const headers = context?.headers
              const ipAddress = getClientIp(headers)
              const userAgent = headers?.get('user-agent') ?? null
              // For OAuth, the live referer header on this request is the
              // provider's own callback page (e.g. accounts.google.com), not
              // the page the user actually came from — socialLogin.tsx stashes
              // the real page in a cookie right before the redirect, which
              // survives the round trip since it's set on our own origin.
              // Falls back to the live header for email/password sign-in,
              // where this request *is* the originating request.
              const referrerUrl = context?.getCookie?.(LOGIN_REFERRER_COOKIE)
                || headers?.get('referer')
                || null
              const device = parseUserAgent(userAgent)
              const geo = lookupGeoLocation(ipAddress)

              // Every session row for this user, including the one just
              // created — count === 1 means signup just auto-signed them in
              // (better-auth's default), anything higher is a returning login.
              const [{ count }] = await db
                .select({ count: sql<number>`count(*)` })
                .from(sessions)
                .where(eq(sessions.userId, session.userId))
              const isFirstSession = Number(count) <= 1

              await logActivity({
                userId: session.userId,
                action: 'login',
                description: isFirstSession
                  ? 'New account registered and signed in'
                  : 'User logged in',
                ipAddress,
                userAgent,
                referrerUrl,
                os: device.os,
                browser: device.browser,
                deviceType: device.deviceType,
                country: geo.country,
                city: geo.city,
              })
            } catch (error) {
              console.error("Failed to log login activity", error)
            }
          },
        },
      },
    },
    // better-auth's admin plugin ends impersonation by deleting the
    // impersonation session and restoring the admin's original session
    // straight from a signed cookie — it never runs session.create, so
    // there's no databaseHooks entry point to log the stop event from.
    // Reading the session here (before the endpoint deletes it) is the only
    // point where both the admin id and the impersonated user id are still
    // available together.
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        // Per-device abuse throttle for the two credential entry points.
        // Primarily keyed by the client's FingerprintJS visitorId
        // (x-device-fingerprint header, set in emailPasswordLogin/Signup), but
        // that header is client-supplied and unsigned — omitting it or
        // randomizing it per request bypasses a fingerprint-only check
        // entirely. IP is a lower-ceiling-tolerant backstop (shared behind
        // NAT/CGNAT/VPN, so it uses MAX_IP, not MAX) that still applies when
        // the header is missing or spoofed.
        if (ctx.path === "/sign-in/email" || ctx.path === "/sign-up/email") {
          const fingerprint = ctx.headers?.get(DEVICE_FINGERPRINT_HEADER)
          const ip = getClientIp(ctx.headers)
          const throttled =
            (fingerprint && (await isDeviceThrottled(fingerprint))) ||
            (ip && (await isDeviceThrottled(`ip:${ip}`, MAX_IP)))
          if (throttled) {
            throw new APIError("TOO_MANY_REQUESTS", {
              message: "Too many attempts from this device. Try again in a few minutes.",
            })
          }
        }

        // Live kill-switch for the two built-in sign-in methods, on top of
        // the (untouched) provider registration above — lets an admin
        // disable a method from the System Settings page and have it take
        // effect immediately, even for a client that already has the button
        // rendered, instead of only on next deploy.
        if (ctx.path === "/sign-in/social") {
          // Scoped to "google" specifically since overrides.socialProviders
          // can register other providers (e.g. apple) this flag shouldn't gate.
          if (ctx.body?.provider === "google") {
            const flags = await getEffectiveAuthFlags()
            if (!flags.google) {
              throw new APIError("FORBIDDEN", { message: "Google sign-in is currently disabled." })
            }
          }
          return
        }

        if (ctx.path === "/sign-in/email") {
          const flags = await getEffectiveAuthFlags()
          if (!flags.emailPassword) {
            throw new APIError("FORBIDDEN", { message: "Email/password sign-in is currently disabled." })
          }
          return
        }

        // One Tap isn't a separate identity, it's a UI shortcut into the
        // same Google account — its plugin hits its own endpoint entirely
        // (not /sign-in/social), so it needs its own guard, and it needs
        // both flags: Google itself must still be allowed, and the One Tap
        // prompt specifically must be enabled.
        if (ctx.path === "/one-tap/callback") {
          const flags = await getEffectiveAuthFlags()
          if (!flags.google || !flags.oneTap) {
            throw new APIError("FORBIDDEN", { message: "Google One Tap is currently disabled." })
          }
          return
        }

        if (ctx.path !== "/admin/stop-impersonating") return

        const current = await getSessionFromCtx(ctx, { disableCookieCache: true })
        if (current?.session.impersonatedBy) {
          const target = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, current.session.userId))
            .limit(1)

          await logActivity({
            userId: current.session.impersonatedBy,
            action: 'impersonation_stopped',
            description: `Admin stopped impersonating ${target[0]?.email ?? current.session.userId}`,
            metadata: { impersonatedUserId: current.session.userId },
          })
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        // Passkey add/remove is a security-sensitive change to how the account
        // can be signed into — email the user whenever one lands, the same way
        // new-device sign-ins are surfaced. Best-effort: never disturb the
        // endpoint's own response.
        if (ctx.path === "/passkey/verify-registration" || ctx.path === "/passkey/delete-passkey") {
          if (ctx.context.returned instanceof APIError) return
          await notifyPasskeyChange(
            ctx,
            ctx.path === "/passkey/verify-registration" ? "added" : "removed",
          )
          return
        }

        if (ctx.path !== "/sign-in/email" && ctx.path !== "/sign-up/email") return

        const fingerprint = ctx.headers?.get(DEVICE_FINGERPRINT_HEADER)
        const ip = getClientIp(ctx.headers)
        const ipKey = ip ? `ip:${ip}` : null
        if (!fingerprint && !ipKey) return

        const failed = ctx.context.returned instanceof APIError
        const rawEmail = (ctx.body as { email?: unknown } | undefined)?.email
        const meta = {
          ipAddress: ip,
          userAgent: ctx.headers?.get("user-agent") ?? null,
          email: typeof rawEmail === "string" ? rawEmail.toLowerCase() : null,
        }
        const keys = [fingerprint, ipKey].filter((k): k is string => !!k)

        // Sign-up abuse is mass account creation — the *successful* ones are
        // the problem — so every sign-up from this device counts.
        if (ctx.path === "/sign-up/email") {
          await Promise.all(keys.map((key) => recordDeviceAttempt(key, { ...meta, kind: "signup" })))
          return
        }

        // /sign-in/email: count failures; a success clears the counter.
        // ponytail: a successful sign-in wipes the device's failure budget, so
        // a credential-stuffing hit resets itself — per-outcome counters if
        // that ceiling ever bites.
        if (failed) {
          await Promise.all(keys.map((key) => recordDeviceAttempt(key, { ...meta, kind: "signin" })))
          await logFailedLogin(ctx)
        } else {
          await Promise.all(keys.map((key) => clearDeviceThrottle(key)))
        }
      }),
    },

    // Base URL for callbacks
    baseURL,

    // Secret for signing cookies and tokens
    secret: process.env.AUTH_SECRET!,

    // The OAuth `state` is a one-time verification row: the callback consumes
    // and deletes it. When the same callback URL gets hit twice (browser
    // prefetch / bfcache / double nav — common on a repeat Google sign-in
    // where Google auto-redirects with no consent screen), the first hit
    // logs the user in and the second finds no `state` row and throws
    // `please_restart_the_process`. Default sends that to better-auth's bare
    // error page; point it at /login instead, which already bounces an
    // authenticated user straight to their callbackUrl — so the losing race
    // just lands them logged in. See better-auth#5658 / #6544.
    onAPIError: {
      errorURL: "/login",
    },

    plugins: [
      // checks to see if oneTap is enabled and if google provider is available, then add the oneTap plugin
      ...(config.AUTH_ENABLE_ONE_TAP && Boolean(socialProviders.google) ? [oneTap()] : []),
      // Registered for impersonation (auth.api.impersonateUser / stopImpersonating)
      // only — role/ban/delete stay on our own custom routes above. adminRoles
      // matches our existing role column so the plugin's own permission checks
      // line up with hasRole(role, 'admin'). banReason is remapped onto our
      // existing bannedReason column instead of adding a duplicate field.
      adminPlugin({
        adminRoles: ["admin"],
        schema: {
          user: {
            fields: {
              banReason: "bannedReason",
            },
          },
        },
      }),
      // TOTP second factor + encrypted backup codes. `issuer` is the label
      // shown in the user's authenticator app.
      twoFactor({ issuer: config.APP_NAME }),
      // WebAuthn passkeys (Touch ID / Windows Hello / security keys) as a
      // passwordless sign-in method. rpID must be the bare host and origin
      // the full URL — both derived from baseURL above.
      passkey({
        rpID: new URL(baseURL).hostname,
        rpName: config.APP_NAME,
        origin: baseURL,
      }),
    ]
  })
}

// Lazy: constructing the default instance validates config and throws if no
// provider is enabled (see the guard above). Building it eagerly at module
// load would mean a downstream project that only imports `createAuth` to
// build its *own* customized instance (README §5) still pays that throw —
// merely importing this module would run it, regardless of whether the
// consuming project ever touches this default export. Deferring construction
// to first property access means the throw only fires for code that actually
// uses the package's own unconfigured `auth` singleton.
let _auth: ReturnType<typeof createAuth> | undefined
function getDefaultAuth() {
  if (!_auth) _auth = createAuth()
  return _auth
}

export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
  get(_target, prop) {
    const instance = getDefaultAuth()
    const value = Reflect.get(instance, prop)
    return typeof value === "function" ? value.bind(instance) : value
  },
  // "prop" in auth (e.g. better-auth's toNextJsHandler does `"handler" in auth`)
  // must also see the real instance — without this it checks the empty
  // placeholder target and always reports false.
  has(_target, prop) {
    return Reflect.has(getDefaultAuth(), prop)
  },
  ownKeys(_target) {
    return Reflect.ownKeys(getDefaultAuth())
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getDefaultAuth(), prop)
  },
})
