import { NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { eq } from "drizzle-orm"

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await db
    .update(users)
    .set({ lastActiveAt: new Date() })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ ok: true })
}
