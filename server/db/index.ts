import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/server/db/schema';

// const sql = neon(process.env.DATABASE_URL as string); // to tell TS its a string
const sql = neon(process.env.DATABASE_URL!); // to tell TS its a string
export const db = drizzle(sql, { schema, logger: true });