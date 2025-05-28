/**
 * @use This script is used to test the connection to the database and perform basic CRUD operations.
 * @description It inserts a new user, retrieves all users, updates the user's age, and deletes the user.
 * @note Make sure to set the DATABASE_URL environment variable in your .env file.
 */

import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { usersTable } from '@/server/db/schema';

// const db = drizzle(process.env.DATABASE_URL!);
import { db } from '@/server/db';

async function main() {
  const user: typeof usersTable.$inferInsert = {
    name: 'John',
    age: 30,
    email: 'john@example.com',
  };

  await db.insert(usersTable).values(user);
  console.log('New user created!')

  const users = await db.select().from(usersTable);
  console.log('Getting all users from the database: ', users)
  /*
  const users: {
    id: number;
    name: string;
    age: number;
    email: string;
  }[]
  */

  await db
    .update(usersTable)
    .set({
      age: 31,
    })
    .where(eq(usersTable.email, user.email));
  console.log('User info updated!')

  await db.delete(usersTable).where(eq(usersTable.email, user.email));
  console.log('User deleted!')
}

main();
