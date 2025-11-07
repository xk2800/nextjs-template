import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./db"
import { users, accounts, sessions, verifications } from "./db/schema"
import bcrypt from 'bcrypt'

export const auth = betterAuth({
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
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // Use bcrypt to maintain compatibility with existing user passwords
    async hash(password) {
      return await bcrypt.hash(password, 10);
    },
    async verify({ hash, password }) {
      return await bcrypt.compare(password, hash);
    }
  },

  // Social Providers
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },

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
