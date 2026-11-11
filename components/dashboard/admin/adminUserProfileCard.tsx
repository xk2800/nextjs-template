import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Badge } from "../../ui/badge"
import { Separator } from "../../ui/separator"
import { formatDate, getUserInitials } from "../../../lib/formatters"
import VerifyEmailButton from "../verifyEmailButton"

type User = {
  id: string
  name: string
  email: string
  image?: string | null
  emailVerified: boolean
  role: string | null | undefined
  createdAt: Date
  updatedAt: Date
}

// One identity card instead of the old Profile + Account Details pair, which
// repeated email and role.
export default function AdminUserProfileCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback className="text-xl">{getUserInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold">{user.name}</h3>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{user.role || 'user'}</Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">{user.id}</p>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-medium text-gray-600">Email</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant={user.emailVerified ? 'default' : 'destructive'}>
              {user.emailVerified ? 'Verified' : 'Unverified'}
            </Badge>
            {!user.emailVerified && <VerifyEmailButton email={user.email} />}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Member Since</p>
            <p className="text-base">{formatDate(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Last Updated</p>
            <p className="text-base">{formatDate(user.updatedAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
