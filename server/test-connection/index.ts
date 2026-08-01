/**
 * @use This script is used to test the connection to the database and perform basic CRUD operations.
 * @description It inserts a new user, retrieves all users, updates the user's age, and deletes the user.
 * @note Make sure to set the DATABASE_URL environment variable in your .env file.
 */

import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { users } from '@/server/db/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Builds its own connection instead of importing the shared `@/server/db`
// singleton, since that module is guarded with "server-only" (to keep it out
// of client bundles) and this script runs via plain bun/node outside Next.js's
// bundler, where that guard throws unconditionally.
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

async function main() {
  const user: typeof users.$inferInsert = {
    name: 'John',
    password: '123456',
    email: 'john@example.com',
  };

  await db.insert(users).values(user);
  console.log('New user created!')

  const selectUser = await db.select().from(users);
  console.log('Getting all users from the database: ', selectUser)
  /*
  const users: {
    id: number;
    name: string;
    age: number;
    email: string;
  }[]
  */

  await db
    .update(users)
    .set({
      password: '31',
    })
    .where(eq(users.email, user.email ?? ''));
  console.log('User info updated!')

  await db.delete(users).where(eq(users.email, user.email ?? ''));
  console.log('User deleted!')
}

main();
