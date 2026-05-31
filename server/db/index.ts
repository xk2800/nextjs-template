// neon-http driver for production
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// postgres driver for local development
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from '@/server/db/schema';
import { config } from '@/config/env';

// Import the query builder
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';

type DrizzleNeon = NeonHttpDatabase<typeof schema>;
type DrizzlePg = PostgresJsDatabase<typeof schema>;

let db: DrizzleNeon | DrizzlePg


if (config.DB_DRIVER === 'pg') {
  const pool = new Pool({
    connectionString: config.DATABASE_URL!,
    ssl: config.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });
  db = drizzlePg(pool, {
    schema,
    logger: true,
  });

  console.log('🟡 Using PostgreSQL (pg) driver');

} else if (config.DB_DRIVER === 'neon') {
  const sql = neon(config.DATABASE_URL!);
  db = drizzle(sql, { schema, logger: true });

  console.log('🟢 Using Neon (HTTP) driver');

} else {
  console.log('Database connection not established, unknown DB_DRIVER:', config.DB_DRIVER);
}
// Note: In production, you might want to disable logging or use a more sophisticated logger.

export { db }