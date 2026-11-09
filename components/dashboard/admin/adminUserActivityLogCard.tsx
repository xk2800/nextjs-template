import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import { parseUserAgent, lookupGeoLocation, formatDeviceInfo, formatLocation } from "../../../lib/request-info"
import AdminUserActivityLogTable from "./adminUserActivityLogTable"

interface ActivityLog {
  id: string
  action: string
  description: string
  ipAddress: string | null
  userAgent: string | null
  metadata: string | null
  createdAt: Date
}

function getReferrerUrl(metadata: string | null): string | null {
  if (!metadata) return null

  try {
    const parsed = JSON.parse(metadata)
    return typeof parsed.referrerUrl === 'string' ? parsed.referrerUrl : null
  } catch {
    return null
  }
}

export default function AdminUserActivityLogCard({ logs }: { logs: ActivityLog[] }) {
  const rows = logs.map((log) => ({
    id: log.id,
    action: log.action,
    description: log.description,
    referrerUrl: getReferrerUrl(log.metadata),
    device: formatDeviceInfo(parseUserAgent(log.userAgent)),
    location: formatLocation(lookupGeoLocation(log.ipAddress)),
    ipAddress: log.ipAddress,
    createdAt: log.createdAt,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>Recent activity for this user</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No activity logs found</p>
        ) : (
          <AdminUserActivityLogTable rows={rows} />
        )}
      </CardContent>
    </Card>
  )
}
