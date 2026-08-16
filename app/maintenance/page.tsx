import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getSystemSettings } from "@/lib/settings-queries"

// Maintenance message can be updated live from the admin settings page, so
// this route must never be prerendered with a stale snapshot — and doing so
// would make `next build` depend on DB reachability, per the same issue in
// app/dashboard/layout.tsx.
export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
  const settings = await getSystemSettings()

  return (
    <div className="max-w-md mx-auto mt-24 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Down for maintenance</CardTitle>
          <CardDescription>
            We&apos;ll be back shortly. Thanks for your patience.
          </CardDescription>
        </CardHeader>
        {settings.maintenanceMessage && (
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {settings.maintenanceMessage}
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
