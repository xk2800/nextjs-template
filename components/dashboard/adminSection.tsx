import Link from "next/link"
import { ShieldCheck, LayoutDashboard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Button } from "../ui/button"

export default function AdminSection() {
  return (
    <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-500/[0.04]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Admin panel</CardTitle>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
            <ShieldCheck className="size-3" />
            Admin only
          </span>
        </div>
        <CardDescription>
          System stats, user management, and audit logs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/dashboard/admin">
          <Button className="w-full">
            <LayoutDashboard />
            Open admin dashboard
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
