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


if (config.NODE_ENV === 'development') {
  // console.log('Database connection established with schema:', schema);

  // Local PostgreSQL using pg Pool
  const pool = new Pool({
    connectionString: config.DATABASE_URL!,
    ssl: (config.NODE_ENV as string) === "production" ? { rejectUnauthorized: false } : undefined,
  });
  db = drizzlePg(pool, {
    schema,
    logger: true,
  });

  console.log('🟡 Using local PostgreSQL (pg) driver IN DEVELOPMENT MODE');

} else if (config.NODE_ENV === 'production') {
  console.log('Database connection established in production mode');

  const sql = neon(process.env.DATABASE_URL!);
  db = drizzle(sql, { schema, logger: true });

  console.log('🟢 Using Neon (HTTP) driver IN PRODUCTION MODE');

}
else {
  console.log('Database connection not established, unknown environment:', config.NODE_ENV);
}
// Note: In production, you might want to disable logging or use a more sophisticated logger.

export { db }