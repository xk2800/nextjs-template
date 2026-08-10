import { cookies } from "next/headers"
import { getUserSessions } from "@xk2800/nextjs-template/sessions/queries"
import { getSystemSettings } from "@xk2800/nextjs-template/settings/queries"
import SessionsCard from "./sessionsCard"

export default async function SessionsSection({ userId }: { userId: string }) {
  const [allSessions, settings] = await Promise.all([
    getUserSessions(userId),
    getSystemSettings(),
  ])
  const cookieStore = await cookies()
  const currentSessionToken = cookieStore.get('better-auth.session_token')?.value || ''

  return (
    <SessionsCard
      userId={userId}
      initialSessions={allSessions}
      currentSessionToken={currentSessionToken}
      enableSessionRevocation={settings.enableSessionRevocation}
    />
  )
}
