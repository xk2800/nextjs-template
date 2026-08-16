import "server-only";
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  DATABASE_URL: z.string().default(''),
  RESEND_API_KEY: z.string().default(''),
  // Seed-only: the live value lives in the system_settings DB row (see
  // lib/settings-queries.ts) once it's been seeded on first read, and is
  // changed from the admin System Settings page, not by editing this var.
  ENABLE_SESSION_REVOCATION: z.string().default('true').transform(val => val === 'true'),
  AUTH_ENABLE_GOOGLE: z.string().default('true').transform(val => val === 'true'),
  AUTH_ENABLE_EMAIL_PASSWORD: z.string().default('true').transform(val => val === 'true'),
  AUTH_ENABLE_ONE_TAP: z.string().default('false').transform(val => val === 'true'),
  DB_DRIVER: z.enum(['pg', 'neon']).default('pg'),
  // Only relevant when DB_DRIVER=pg — whether the target Postgres server has SSL
  // enabled. Self-hosted Postgres (e.g. via Docker/Dokploy) typically does not.
  DATABASE_SSL: z.string().default('false').transform(val => val === 'true'),
})
// No refine() gating "at least one of AUTH_ENABLE_GOOGLE / AUTH_ENABLE_EMAIL_PASSWORD"
// here — this module can't see createAuth() overrides, so it can't tell a genuinely
// broken config (both off, no replacement) apart from a valid custom-provider-only
// setup (both off, e.g. Apple added via createAuth()). That check lives in
// server/auth.ts's createAuth(), which evaluates the *final* merged provider list.

const results = envSchema.safeParse(process.env);

if (results.success && (results.data.NODE_ENV === 'development')) {
  console.log('Environment variables loaded:', Object.keys(results.data));
}

if (!results.success) {
  console.error('Invalid environment variables:', results.error.format());
  throw new Error('Invalid environment variables');
}

export const config = results.data;
