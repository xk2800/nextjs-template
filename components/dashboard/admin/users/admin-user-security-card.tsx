import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card"
import { Badge } from "../../../ui/badge"
import { Separator } from "../../../ui/separator"

const PROVIDER_LABELS: Record<string, string> = { credential: 'Email & password', google: 'Google' }

export default function AdminUserSecurityCard({
  security,
}: {
  security: { twoFactorEnabled: boolean; passkeyCount: number; providers: string[] }
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Two-factor authentication</p>
          <div className="mt-1">
            <Badge variant={security.twoFactorEnabled ? 'default' : 'outline'}>
              {security.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
            </Badge>
          </div>
        </div>
        <Separator />
        <div>
          <p className="text-sm font-medium text-gray-600">Passkeys</p>
          <p className="text-base">{security.passkeyCount === 0 ? 'None registered' : `${security.passkeyCount} registered`}</p>
        </div>
        <Separator />
        <div>
          <p className="text-sm font-medium text-gray-600">Sign-in methods</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {security.providers.length === 0 ? (
              <span className="text-base">None linked yet</span>
            ) : (
              security.providers.map((p) => (
                <Badge key={p} variant="secondary">{PROVIDER_LABELS[p] ?? p}</Badge>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
