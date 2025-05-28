import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();


const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().default(''),
})

const results = envSchema.safeParse(process.env);

if (results.success && results.data.NODE_ENV === 'development') {
  console.log('Environment variables:', results.data);
  // console.log(results);
}

if (!results.success) {
  console.error('Invalid environment variables:', results.error.format());
  throw new Error('Invalid environment variables');
}

export const config = results.data;
