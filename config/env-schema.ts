// No "server-only" guard here — this schema is also imported by scripts that
// run outside Next.js's bundler (e.g. scripts/doctor.ts), where that guard
// throws unconditionally. config/env.ts re-exports the parsed, guarded result
// for app code; import this file directly only from non-Next scripts.
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  DATABASE_URL: z.string().default(''),
  RESEND_API_KEY: z.string().default(''),
  // Display name for this deployment — shown as the authenticator-app label
  // (2FA issuer) and the passkey relying-party name. Consuming projects set
  // this in their own .env; defaults to the template name.
  APP_NAME: z.string().default('Next.js Template'),
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
});
