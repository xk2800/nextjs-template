import Link from "next/link"
import { ShieldCheck, Users, Activity, UserCog, ScrollText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Button } from "../ui/button"

export interface AdminStats {
  totalUsers: number
  activeSessions: number
  adminCount: number
  regularUsers: number
}

const stats = (data: AdminStats) => [
  { label: "Total users", value: data.totalUsers, icon: Users },
  { label: "Active sessions", value: data.activeSessions, icon: Activity },
  { label: "Admins", value: data.adminCount, icon: UserCog },
  { label: "Regular users", value: data.regularUsers, icon: Users },
]

export default function AdminSection({ stats: statsData }: { stats: AdminStats }) {
  return (
    <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-500/[0.04]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Admin overview</CardTitle>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
            <ShieldCheck className="size-3" />
            Admin only
          </span>
        </div>
        <CardDescription>
          System statistics and user management preview
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats(statsData).map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Icon className="size-3.5" />
                {label}
              </div>
              <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          <Link href="/dashboard/admin/users">
            <Button className="w-full">
              <Users />
              Manage users
            </Button>
          </Link>
          <Link href="/dashboard/admin/activity-logs">
            <Button variant="outline" className="w-full">
              <ScrollText />
              View audit log
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
