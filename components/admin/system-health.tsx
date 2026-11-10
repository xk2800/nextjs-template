import { sql } from "drizzle-orm"
import { Activity, CircleCheck, CircleX } from "lucide-react"
import { db } from "@/server/db"
import { auth } from "@/server/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Example widget: add your own checks (queue, storage, third-party APIs).
async function pingDb() {
  const start = performance.now()
  try {
    await db.execute(sql`select 1`)
    return { ok: true, ms: Math.round(performance.now() - start) }
  } catch {
    return { ok: false, ms: 0 }
  }
}

// Builds the auth instance and runs its /ok endpoint (no DB, no session).
async function pingAuth() {
  try {
    return (await auth.api.ok()).ok === true
  } catch {
    return false
  }
}

function fmtUptime(s: number) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60)
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`
}

export default async function SystemHealth() {
  const [database, authOk] = await Promise.all([pingDb(), pingAuth()])
  const Icon = database.ok ? CircleCheck : CircleX
  const AuthIcon = authOk ? CircleCheck : CircleX

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="size-4" />
          <CardTitle>System health</CardTitle>
        </div>
        <CardDescription>Checked when this page loads. Uptime is per server instance and resets on deploy.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Database</span>
          <span className={`flex items-center gap-1.5 font-medium ${database.ok ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}>
            <Icon className="size-4" />
            {database.ok ? `Operational (${database.ms} ms)` : "Unreachable"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Auth API</span>
          <span className={`flex items-center gap-1.5 font-medium ${authOk ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}>
            <AuthIcon className="size-4" />
            {authOk ? "Operational" : "Unavailable"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Server uptime</span>
          <span className="font-medium">{fmtUptime(process.uptime())}</span>
        </div>
      </CardContent>
    </Card>
  )
}
