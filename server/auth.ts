import "server-only"
import { betterAuth, type BetterAuthOptions } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq, sql } from "drizzle-orm"
import { db } from "./db"
import { users, accounts, sessions, verifications } from "./db/schema"
import { config } from "@/config/env"
import bcrypt from 'bcrypt'
import { oneTap, admin as adminPlugin } from "better-auth/plugins";
import { createAuthMiddleware, getSessionFromCtx, APIError } from "better-auth/api"
import { logActivity } from "@/lib/activity-logger"
import { getClientIp, parseUserAgent, lookupGeoLocation } from "@/lib/request-info"
import { LOGIN_REFERRER_COOKIE } from "@/lib/cookie-names"
import { getEffectiveAuthFlags } from "@/lib/settings-queries"
import { getResend, EMAIL_FROM } from "@/lib/resend"
import { EmailTemplateResetPassword } from "@/components/email/email-template-reset-password"

type AuthOverrides = {
  // Merged with (not replacing) the default `google` provider below, so
  // consuming projects can add e.g. `apple` without forking this file.
  socialProviders?: BetterAuthOptions["socialProviders"]
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

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: users,
        account: accounts,
        session: sessions,
        verification: verifications,
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
    },

    // Base URL for callbacks
    baseURL: process.env.NEXTAUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",

    // Secret for signing cookies and tokens
    secret: process.env.AUTH_SECRET!,

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
