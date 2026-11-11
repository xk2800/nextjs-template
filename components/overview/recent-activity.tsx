import Link from "next/link"
import { KeyRound, Plus, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { recentActivity } from "@/lib/mock/dashboard-data"

// Wire these buttons to your own routes/actions.
export function RecentActivity() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button variant="outline" className="justify-start"><Plus /> Create project</Button>
          <Button variant="outline" className="justify-start"><UserPlus /> Invite teammate</Button>
          <Button variant="outline" className="justify-start"><KeyRound /> Generate API key</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{a.text}</span>
              <span className="shrink-0 text-muted-foreground">{a.time}</span>
            </div>
          ))}
          <Button asChild variant="link" className="h-auto p-0">
            <Link href="/dashboard/settings?tab=profile">View your account activity</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
