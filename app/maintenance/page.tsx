import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getSystemSettings } from "@/lib/settings-queries"

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
