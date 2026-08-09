import { Users, UserPlus, Activity, Ban } from "lucide-react"
import { getAdminDashboardStats } from "@xk2800/nextjs-template/admin/queries"
import { Card, CardContent } from "@/components/ui/card"

const STAT_CONFIG = [
  { key: "totalUsers", label: "Total users", icon: Users },
  { key: "newSignupsThisWeek", label: "New signups this week", icon: UserPlus },
  { key: "activeSessions", label: "Active sessions", icon: Activity },
  { key: "bannedCount", label: "Banned users", icon: Ban },
] as const

export default async function AdminStatsGrid() {
  const stats = await getAdminDashboardStats()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {STAT_CONFIG.map(({ key, label, icon: Icon }) => (
        <Card key={key}>
          <CardContent>
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Icon className="size-3.5" />
              {label}
            </div>
            <p className="text-3xl font-bold mt-2 text-foreground">{stats[key]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
