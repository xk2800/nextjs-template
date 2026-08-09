import { requireAuth } from "@/lib/auth-helpers"
import DashboardHeader from "@/components/dashboard/dashboardHeader"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import Heartbeat from "@/components/dashboard/heartbeat"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Full session validation - this is the security layer
  const session = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Heartbeat />
      <DashboardHeader userName={session.user.name} actions={<ThemeToggle />} />

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
