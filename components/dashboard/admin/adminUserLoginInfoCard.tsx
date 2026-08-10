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
import { formatDateTime } from "../../../lib/formatters"
import { formatDeviceInfo, formatLocation, type DeviceType } from "../../../lib/request-info"

interface LoginEvent {
  id: string
  description: string
  referrerUrl: string | null
  os: string | null
  browser: string | null
  deviceType: string | null
  country: string | null
  city: string | null
  ipAddress: string | null
  createdAt: Date
}

export default function AdminUserLoginInfoCard({ logins }: { logins: LoginEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration & Login Info</CardTitle>
        <CardDescription>
          Referrer, device, and location captured for each sign-in
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logins.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No login history found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Landing URL</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logins.map((login) => {
                  const isRegistration = login.description.toLowerCase().includes('registered')

                  return (
                    <TableRow key={login.id}>
                      <TableCell>
                        <Badge variant={isRegistration ? 'default' : 'outline'}>
                          {isRegistration ? 'Registered' : 'Login'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDeviceInfo({
                          os: login.os,
                          browser: login.browser,
                          deviceType: (login.deviceType as DeviceType) || 'desktop',
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatLocation({ country: login.country, city: login.city })}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {login.referrerUrl || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {login.ipAddress || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDateTime(login.createdAt)}
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
