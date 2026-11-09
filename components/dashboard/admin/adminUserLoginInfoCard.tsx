import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import { formatDeviceInfo, formatLocation, type DeviceType } from "../../../lib/request-info"
import AdminUserLoginInfoTable from "./adminUserLoginInfoTable"

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
  const rows = logins.map((login) => ({
    id: login.id,
    isRegistration: login.description.toLowerCase().includes('registered'),
    device: formatDeviceInfo({
      os: login.os,
      browser: login.browser,
      deviceType: (login.deviceType as DeviceType) || 'desktop',
    }),
    location: formatLocation({ country: login.country, city: login.city }),
    referrerUrl: login.referrerUrl,
    ipAddress: login.ipAddress,
    createdAt: login.createdAt,
  }))

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
          <AdminUserLoginInfoTable rows={rows} />
        )}
      </CardContent>
    </Card>
  )
}
