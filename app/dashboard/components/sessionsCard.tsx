import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getUserSessions } from "@/lib/session-queries"
import { formatDateTime } from "@/lib/auth-helpers"

export default async function SessionsCard({ userId }: { userId: string }) {
  const sessions = await getUserSessions(userId)
  const now = new Date()

  // Separate active and expired sessions
  const activeSessions = sessions.filter(s => s.expiresAt > now)
  const expiredSessions = sessions.filter(s => s.expiresAt <= now)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>
          You have {activeSessions.length} active session(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activeSessions.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-8">
            No active sessions found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(session.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(session.expiresAt)}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {session.ipAddress || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {session.userAgent || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Show expired sessions count if any */}
        {expiredSessions.length > 0 && (
          <p className="text-xs text-gray-500 mt-4">
            {expiredSessions.length} expired session(s) not shown
          </p>
        )}
      </CardContent>
    </Card>
  )
}
