import { NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { and, eq, isNull, lt, or } from "drizzle-orm"

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Skip the write when another tab (or this one) pinged recently: tabs ping
  // every 30s, so this collapses duplicate tabs into one write per ~25s.
  await db
    .update(users)
    .set({ lastActiveAt: new Date() })
    .where(
      and(
        eq(users.id, session.user.id),
        or(isNull(users.lastActiveAt), lt(users.lastActiveAt, new Date(Date.now() - 25_000))),
      ),
    )

  return NextResponse.json({ ok: true })
}
