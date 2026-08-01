import { defineConfig } from 'drizzle-kit';

// Reads process.env directly (not the server-only-guarded @/config/env) since
// drizzle-kit runs via plain Node/esbuild, outside Next.js's bundler — the
// "server-only" export condition that protects config/env.ts from client
// bundles isn't set there, so importing it here would throw unconditionally.
export default defineConfig({
  out: './server/drizzle',
  schema: './server/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
// This configuration file is used by Drizzle ORM to generate the database schema