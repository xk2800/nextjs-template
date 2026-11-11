import { getImpersonationSessions } from "@/lib/db/queries/impersonation"
import { getDeviceThrottleActivity } from "@/lib/db/queries/admin"
import SecurityHighlightsCollapsible from "@/components/dashboard/admin/activity-logs/security-highlights-collapsible"

// Fetches the numbers for the collapsed header and the two panels.
export default async function SecurityHighlights() {
  const [imp, throttle] = await Promise.all([
    getImpersonationSessions({ limit: 5 }),
    getDeviceThrottleActivity(50),
  ])
  const active = throttle.filter((r) => r.windowActive)

  return (
    <SecurityHighlightsCollapsible
      activeImpersonations={imp.stats.active}
      recentImpersonations={imp.sessions.map((s) => ({
        id: s.id,
        status: s.status,
        adminLabel: s.adminName || s.adminEmail || "Unknown admin",
        targetLabel: s.targetName || s.targetEmail || "deleted account",
        startedAt: s.startedAt,
      }))}
      blockedNow={active.filter((r) => r.blocked).length}
      throttled={active.slice(0, 5).map((r) => ({
        fingerprint: r.fingerprint,
        ipAddress: r.ipAddress,
        count: r.count,
        blocked: r.blocked,
      }))}
    />
  )
}
