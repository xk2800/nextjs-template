import { Activity, CreditCard, HeartPulse, Users, type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { overviewStats } from "@/lib/mock-dashboard-data"

const icons: Record<string, LucideIcon> = {
  users: Users,
  "credit-card": CreditCard,
  activity: Activity,
  "heart-pulse": HeartPulse,
}

export function OverviewStats() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {overviewStats.map(({ label, value, trend, up, icon }) => {
        const Icon = icons[icon]
        return (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">{value}</div>
              <Badge variant={up ? "secondary" : "destructive"}>{trend}</Badge>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
