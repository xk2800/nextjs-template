import { MonitorSmartphone } from "lucide-react"
import { getRecentNewDevices } from "@xk2800/nextjs-template/admin/queries"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import NewDeviceTable from "./newDeviceTable"

// First sign-in from a device for each account (written by
// app/api/device-check/route.ts). The user and every admin also get an email;
// this is the durable, at-a-glance surface. If a row looks like a hijack,
// "Revoke sessions" logs that account out everywhere in one click, or open the
// account for the full session list / activity trail.
export default async function NewDeviceCard() {
  const rows = await getRecentNewDevices(20)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <MonitorSmartphone className="size-4" />
          <CardTitle>New devices</CardTitle>
        </div>
        <CardDescription>
          First sign-in from a device for each account, newest first. Revoke the
          account&apos;s sessions if the sign-in wasn&apos;t them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No new-device sign-ins recorded yet</p>
        ) : (
          <NewDeviceTable rows={rows} />
        )}
      </CardContent>
    </Card>
  )
}
