/**
 * Password Migration Script
 *
 * This script migrates user passwords from the users.password field (NextAuth)
 * to the accounts table (Better-Auth credential provider).
 *
 * Run with: bun --env-file=.env.development scripts/migrate-passwords.ts
 */

import { db } from "@/server/db"
import { users, accounts } from "@/server/db/schema"
import { isNotNull, eq, and } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

async function migratePasswords() {
  console.log('🔄 Starting password migration...\n')

  // Find all users with passwords in the users table
  const usersWithPasswords = await db
    .select()
    .from(users)
    .where(isNotNull(users.password))

  console.log(`Found ${usersWithPasswords.length} users with passwords\n`)

  let migratedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const user of usersWithPasswords) {
    try {
      // Check if credential account already exists
      const existingAccount = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.userId, user.id),
          eq(accounts.providerId, "credential")
        ),
      })

      if (existingAccount) {
        console.log(`⏭️  Skipped: ${user.email} (credential account already exists)`)
        skippedCount++
        continue
      }

      if (!user.email) {
        console.log(`⚠️  Skipped: User ${user.id} (no email address)`)
        skippedCount++
        continue
      }

      // Create credential account with password
      await db.insert(accounts).values({
        id: createId(),
        userId: user.id,
        accountId: user.email, // Better-Auth uses email as accountId for credentials
        providerId: "credential",
        password: user.password!,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      console.log(`✅ Migrated: ${user.email}`)
      migratedCount++

    } catch (error) {
      console.error(`❌ Error migrating user ${user.email}:`, error)
      errorCount++
    }
  }

  console.log('\n📊 Migration Summary:')
  console.log(`   ✅ Migrated: ${migratedCount}`)
  console.log(`   ⏭️  Skipped: ${skippedCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📝 Total: ${usersWithPasswords.length}\n`)

  if (migratedCount > 0) {
    console.log('⚠️  Note: You may want to remove the password column from the users table')
    console.log('   after verifying all passwords work correctly in the accounts table.\n')
  }

  console.log('✨ Migration complete!\n')
}

// Run the migration
migratePasswords()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  })
