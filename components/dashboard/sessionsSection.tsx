import { cookies } from "next/headers"
import { getUserSessions } from "@/lib/session-queries"
import { config } from "@/config/env"
import SessionsCard from "@/components/dashboard/sessionsCard"

export default async function SessionsSection({ userId }: { userId: string }) {
  const allSessions = await getUserSessions(userId)
  const cookieStore = await cookies()
  const currentSessionToken = cookieStore.get('better-auth.session_token')?.value || ''

  return (
    <SessionsCard
      userId={userId}
      initialSessions={allSessions}
      currentSessionToken={currentSessionToken}
      enableSessionRevocation={config.ENABLE_SESSION_REVOCATION}
    />
  )
}
