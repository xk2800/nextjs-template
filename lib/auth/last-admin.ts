import { sql } from "drizzle-orm"
import { users } from "../../server/db/schema"

/**
 * SQL condition: "after removing `excludeIds` (delete, demote or ban), at least
 * one other active (admin, not banned) account remains". Put it in the WHERE of
 * the write itself so check and write are one statement. The subquery row-locks
 * every active admin, so two admins banning/demoting/deleting each other at
 * once serialize: the second re-reads after the first commits and is refused.
 * One statement also works on the neon-http driver (no transactions).
 * Callers treat "0 rows written" as the last-admin refusal.
 */
export function otherActiveAdminExists(excludeIds: string[]) {
  const ids = sql.join(excludeIds.map((id) => sql`${id}`), sql`, `)
  return sql`(select count(*) from (select ${users.id} as id from ${users} where ${users.role} = 'admin' and ${users.banned} = false for update) a where a.id not in (${ids})) > 0`
}
