import "server-only";
import { envSchema } from './env-schema';

const results = envSchema.safeParse(process.env);

if (results.success && (results.data.NODE_ENV === 'development')) {
  console.log('Environment variables loaded:', Object.keys(results.data));
}

if (!results.success) {
  console.error('Invalid environment variables:', results.error.format());
  throw new Error('Invalid environment variables');
}

export const config = results.data;
