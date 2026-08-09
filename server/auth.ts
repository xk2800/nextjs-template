import "server-only"
import { betterAuth, type BetterAuthOptions } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"
import { db } from "./db"
import { users, accounts, sessions, verifications } from "./db/schema"
import { config } from "@/config/env"
import bcrypt from 'bcrypt'
import { oneTap } from "better-auth/plugins";

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
      }
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
          async after(session) {
            try {
              await db
                .update(users)
                .set({ lastLoginAt: new Date() })
                .where(eq(users.id, session.userId))
            } catch (error) {
              console.error("Failed to update lastLoginAt", error)
            }
          },
        },
      },
    },
    // Base URL for callbacks
    baseURL: process.env.NEXTAUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",

    // Secret for signing cookies and tokens
    secret: process.env.AUTH_SECRET!,

    plugins: [
      oneTap(), // Add the One Tap server plugin
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
