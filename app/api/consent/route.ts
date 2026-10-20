import { NextResponse } from "next/server"
import { auth } from "@/server/auth"
import { headers } from "next/headers"
import { db } from "@/server/db"
import { consentLog } from "@/server/db/schema"
import { desc, eq } from "drizzle-orm"
import { CONSENT_VERSION, isValidConsent } from "@/lib/cookie-names"

// Proof of consent (GDPR Art. 7(1)). components/site/cookie-banner.tsx posts
// the signed-in user's current cookie_consent value here. Signed-in only: a
// record proves something when it's tied to an account, and it keeps this
// endpoint closed to anonymous spam. Idempotent — a row is only added when the
// choice or CONSENT_VERSION differs from the user's latest record.
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { choice } = await request.json().catch(() => ({}))
  if (!isValidConsent(choice)) {
    return NextResponse.json({ error: "Invalid choice" }, { status: 400 })
  }

  const [latest] = await db
    .select({ id: consentLog.id, choice: consentLog.choice, version: consentLog.version })
    .from(consentLog)
    .where(eq(consentLog.userId, session.user.id))
    .orderBy(desc(consentLog.createdAt))
    .limit(1)

  if (latest?.choice === choice && latest.version === CONSENT_VERSION) {
    return NextResponse.json({ ok: true, recorded: false })
  }

  // previousId + the (userId, previousId) unique index make this race-safe:
  // if several tabs post at once, they all name the same predecessor and only
  // the first insert lands.
  const [row] = await db
    .insert(consentLog)
    .values({ userId: session.user.id, choice, version: CONSENT_VERSION, previousId: latest?.id ?? "" })
    .onConflictDoNothing()
    .returning({ id: consentLog.id })
  return NextResponse.json({ ok: true, recorded: !!row })
}
