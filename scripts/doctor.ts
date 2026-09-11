/**
 * @use bun run doctor  (reads .env.development — pass a different file with
 *      `bun --env-file=.env.production scripts/doctor.ts` to check another env)
 * @description Diagnoses the most common "just cloned the template" friction
 * points: runtime version, malformed env, dead DB connection, unapplied
 * migrations. Builds its own DB connection instead of importing `@/server/db`
 * or `@/config/env` — both are guarded with "server-only" (see config/env.ts),
 * which throws unconditionally outside Next.js's bundler. Same workaround as
 * server/test-connection/index.ts.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { envSchema } from '../config/env-schema';

let failed = false;
const fail = (msg: string) => { console.error(`✗ ${msg}`); failed = true; };
const ok = (msg: string) => console.log(`✓ ${msg}`);
const warn = (msg: string) => console.warn(`⚠ ${msg}`);

console.log('--- runtime ---');
ok(`Bun ${typeof Bun !== 'undefined' ? Bun.version : '(not running under bun)'}, Node ${process.version}`);

console.log('\n--- env ---');
const env = envSchema.safeParse(process.env);
if (!env.success) {
  fail('Invalid or missing environment variables:');
  for (const issue of env.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
} else {
  ok(`env valid (DB_DRIVER=${env.data.DB_DRIVER})`);
}

console.log('\n--- database ---');
if (env.success && env.data.DATABASE_URL) {
  try {
    if (env.data.DB_DRIVER === 'pg') {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: env.data.DATABASE_URL,
        ssl: env.data.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
      });
      await pool.query('SELECT 1');
      ok('connected (pg)');

      console.log('\n--- migrations ---');
      const journal = JSON.parse(
        readFileSync(join(import.meta.dirname, '../server/drizzle/meta/_journal.json'), 'utf-8')
      );
      const localCount = journal.entries.length;
      const { rows } = await pool.query(
        `SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`
      ).catch(() => ({ rows: [{ count: 0 }] }));
      const appliedCount = rows[0].count;
      if (appliedCount < localCount) {
        warn(`${localCount - appliedCount} pending migration(s) — run \`bun run migrate:dev\``);
      } else {
        ok(`up to date (${localCount} migration(s) in repo, ${appliedCount} applied)`);
      }
      await pool.end();
    } else {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(env.data.DATABASE_URL);
      await sql`SELECT 1`;
      ok('connected (neon)');
      warn('migration check skipped — only implemented for DB_DRIVER=pg for now');
    }
  } catch (err) {
    fail(`could not connect: ${err instanceof Error ? err.message : err}`);
  }
} else {
  fail('DATABASE_URL not set — skipping connection and migration checks');
}

console.log('');
if (failed) {
  console.error('doctor found problems above.');
  process.exit(1);
} else {
  console.log('all checks passed.');
}
