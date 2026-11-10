import { requireAuth } from "@/lib/auth-helpers"
import { WelcomeBanner } from "@/components/overview/welcome-banner"
import { OverviewStats } from "@/components/overview/overview-stats"
import { OverviewChart } from "@/components/overview/overview-chart"
import { RecentActivity } from "@/components/overview/recent-activity"

export default async function DashboardPage() {
  const session = await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome back, {session.user.name}</p>
      </div>
      <WelcomeBanner />
      <OverviewStats />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><OverviewChart /></div>
        <RecentActivity />
      </div>
    </div>
  )
}
