import "server-only"
import { betterAuth, type BetterAuthOptions } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./db"
import { users, accounts, sessions, verifications } from "./db/schema"
import { config } from "@/config/env"
import bcrypt from 'bcrypt'

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

  // Belt-and-suspenders check on the *final* merged config (accounts for
  // overrides.socialProviders too — config/env.ts's own check can't see those,
  // since overrides are only known here at createAuth() call time).
  if (Object.keys(socialProviders).length === 0 && !emailAndPasswordEnabled) {
    throw new Error(
      "No auth provider is enabled — every social provider is off and emailAndPassword.enabled is false. " +
      "At least one sign-in method must stay enabled or no one could log in."
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

    // Base URL for callbacks
    baseURL: process.env.NEXTAUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",

    // Secret for signing cookies and tokens
    secret: process.env.AUTH_SECRET!,
  })
}

export const auth = createAuth()
