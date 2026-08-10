import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import { Badge } from "../../ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table"
import { formatDateTime, actionBadgeVariant } from "../../../lib/formatters"
import { parseUserAgent, lookupGeoLocation, formatDeviceInfo, formatLocation } from "../../../lib/request-info"

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const referrerUrl = getReferrerUrl(log.metadata)

                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant={actionBadgeVariant[log.action] || 'outline'}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs">
                        <div className="truncate">{log.description}</div>
                        {referrerUrl && (
                          <div className="text-xs text-gray-500 truncate">
                            via {referrerUrl}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDeviceInfo(parseUserAgent(log.userAgent))}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatLocation(lookupGeoLocation(log.ipAddress))}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {log.ipAddress || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
