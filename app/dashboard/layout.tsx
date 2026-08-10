import { requireAuth, hasRole } from "@/lib/auth-helpers"
import { getSystemSettings } from "@/lib/settings-queries"
import { redirect } from "next/navigation"
import DashboardHeader from "@/components/dashboard/dashboardHeader"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import Heartbeat from "@/components/dashboard/heartbeat"
import ImpersonationBanner from "@/components/dashboard/impersonationBanner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Full session validation - this is the security layer
  const session = await requireAuth()

  // Non-admins get bounced to a static maintenance page while it's on;
  // admins pass through so they can reach /dashboard/admin/settings to turn
  // it back off. This only covers the dashboard tree — see
  // lib/settings-queries.ts's getSystemSettings() if you want broader
  // (e.g. marketing-page) coverage in your own layouts.
  const settings = await getSystemSettings()
  if (settings.maintenanceMode && !hasRole(session.user.role, 'admin')) {
    redirect('/maintenance')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Heartbeat />
      <ImpersonationBanner />
      <DashboardHeader userName={session.user.name} actions={<ThemeToggle />} />

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
