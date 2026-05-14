import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { passkey } from "@better-auth/passkey"
import { db } from "./db"
import { users, accounts, sessions, verifications, passkeys } from "./db/schema"
import bcrypt from 'bcrypt'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      account: accounts,
      session: sessions,
      verification: verifications,
      // Explicitly mapped so Drizzle knows the "passkey" model name → our table
      passkey: passkeys,
    },
  }),

  plugins: [
    passkey({
      // rpID must be the bare hostname only — WebAuthn rejects full URLs or ports
      rpID: new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000").hostname,
      rpName: "Next.js Template",
      // origin must exactly match the value the browser sees, including protocol
      origin: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      // Hybrid caching avoids a DB round-trip on every request while keeping
      // session revocation effective within the 5-minute window
      enabled: true,
      maxAge: 5 * 60,
    }
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {
      // bcrypt keeps compatibility with passwords hashed before the Better-Auth migration
      async hash(password: string) {
        return await bcrypt.hash(password, 10);
      },
      async verify({ hash, password }: { hash: string, password: string }) {
        return await bcrypt.compare(password, hash);
      },
    },
  },

  socialProviders: {
    google: {
      // Support both naming conventions that may exist across environments
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        // input: false prevents a client from escalating their own role via the sign-up payload
        input: false,
      },
    },
  },

  advanced: {
    database: {
      // cuid2 gives collision-resistant, URL-safe IDs without relying on DB sequences
      generateId: () => require('@paralleldrive/cuid2').createId() as string,
    },
  },

  baseURL: process.env.NEXTAUTH_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.AUTH_SECRET!,
})
