import 'server-only';

// neon-http driver for production
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// postgres driver for local development
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';
import { config } from '../../config/env';
import { pgSslOptions } from '../../config/pg-ssl';

import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

// Both drivers are PgDatabase; typing as the shared base keeps query-builder
// calls (e.g. .returning(...)) well-typed instead of a driver union.
let db: PgDatabase<PgQueryResultHKT, typeof schema>

if (config.DB_DRIVER === 'pg') {
  const pool = new Pool({
    connectionString: config.DATABASE_URL!,
    ssl: config.DATABASE_SSL ? pgSslOptions() : undefined,
    // pg waits forever by default; a hung DB would otherwise freeze every request (proxy reads settings).
    connectionTimeoutMillis: 5000,
    query_timeout: 15000, // roomy enough for the 10k-row exports
  });
  db = drizzlePg(pool, {
    schema,
    logger: process.env.NODE_ENV === 'development',
  });

  console.log('🟡 Using PostgreSQL (pg) driver');

} else {
  // Fresh 15s signal (same as pg query_timeout) per request (a static signal passed to neon() would expire for good).
  // Global-only option, fine here: this is the only Neon client in the app.
  neonConfig.fetchFunction = (url: string, init?: RequestInit) =>
    fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  const sql = neon(config.DATABASE_URL!);
  db = drizzle(sql, { schema, logger: process.env.NODE_ENV === 'development' });

  console.log('🟢 Using Neon (HTTP) driver');
}
// Query logging prints parameters (session/reset tokens, hashes): development only.

export { db }