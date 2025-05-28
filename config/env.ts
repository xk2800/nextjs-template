import * as dotenv from 'dotenv';
import { z } from 'zod';

// dotenv.config();
dotenv.config({ path: '.env.local' });


const envSchema = z.object({
  DATABASE_URL: z.string().default(''),
})

const results = envSchema.safeParse(process.env);

console.log(results);

if (!results.success) {
  console.error('Invalid environment variables:', results.error.format());
  throw new Error('Invalid environment variables');
}

export const config = results.data;
