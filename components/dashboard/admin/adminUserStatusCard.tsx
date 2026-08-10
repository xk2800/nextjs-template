import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Separator } from "../../ui/separator"
import { formatDateTime } from "../../../lib/formatters"

type User = {
  banned: boolean
  bannedAt: Date | null
  bannedReason: string | null
  lastLoginAt: Date | null
  lastActiveAt: Date | null
}

export default function AdminUserStatusCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Status</p>
          <div className="mt-1">
            {user.banned ? (
              <Badge variant="destructive">Banned</Badge>
            ) : (
              <Badge variant="outline">Active</Badge>
            )}
          </div>
          {user.banned && user.bannedReason && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {user.bannedReason}
            </p>
          )}
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium text-gray-600">Last Login</p>
          <p className="text-base">
            {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
          </p>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium text-gray-600">Last Active</p>
          <p className="text-base">
            {user.lastActiveAt ? formatDateTime(user.lastActiveAt) : 'Never'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
