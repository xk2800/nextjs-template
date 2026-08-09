import { cookies } from "next/headers"
import { getUserSessions } from "@xk2800/nextjs-template/sessions/queries"
import { config } from "@xk2800/nextjs-template/config/env"
import SessionsCard from "./sessionsCard"

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
