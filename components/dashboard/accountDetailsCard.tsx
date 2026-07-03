import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { formatDate } from "../../lib/formatters"

type User = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  role: string | null | undefined
  createdAt: Date
  updatedAt: Date
}

export default function AccountDetailsCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Role</p>
          <p className="text-base capitalize">{user.role || 'user'}</p>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium text-gray-600">Email Status</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-base">{user.email}</p>
            <Badge variant={user.emailVerified ? 'default' : 'destructive'}>
              {user.emailVerified ? 'Verified' : 'Unverified'}
            </Badge>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium text-gray-600">Member Since</p>
          <p className="text-base">{formatDate(user.createdAt)}</p>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium text-gray-600">Last Updated</p>
          <p className="text-base">{formatDate(user.updatedAt)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
