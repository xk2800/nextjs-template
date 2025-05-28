import { config } from '@/config/env';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './server/drizzle',
  schema: './server/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.DATABASE_URL!,
  },
});
// This configuration file is used by Drizzle ORM to generate the database schema