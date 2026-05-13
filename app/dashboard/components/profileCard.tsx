import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { hasRole } from "@/lib/auth-helpers"
import { getUserInitials } from "@/lib/formatters"

type User = {
  id: string
  name: string
  email: string
  image?: string | null
  role: string | null | undefined
}

export default function ProfileCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback className="text-2xl">
              {getUserInitials(user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <Badge variant={hasRole(user.role, 'admin') ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
