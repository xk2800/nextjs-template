import "server-only";
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  DATABASE_URL: z.string().default(''),
  RESEND_API_KEY: z.string().default(''),
  ENABLE_SESSION_REVOCATION: z.string().default('true').transform(val => val === 'true'),
  AUTH_ENABLE_GOOGLE: z.string().default('true').transform(val => val === 'true'),
  AUTH_ENABLE_EMAIL_PASSWORD: z.string().default('true').transform(val => val === 'true'),
  DB_DRIVER: z.enum(['pg', 'neon']).default('pg'),
}).refine(
  data => data.AUTH_ENABLE_GOOGLE || data.AUTH_ENABLE_EMAIL_PASSWORD,
  {
    message: 'At least one auth provider must stay enabled — AUTH_ENABLE_GOOGLE and AUTH_ENABLE_EMAIL_PASSWORD cannot both be false, or no one could sign in.',
    path: ['AUTH_ENABLE_GOOGLE'],
  }
)

const results = envSchema.safeParse(process.env);

if (results.success && (results.data.NODE_ENV === 'development')) {
  console.log('Environment variables loaded:', Object.keys(results.data));
}

if (!results.success) {
  console.error('Invalid environment variables:', results.error.format());
  throw new Error('Invalid environment variables');
}

export const config = results.data;
