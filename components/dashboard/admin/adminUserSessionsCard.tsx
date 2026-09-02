'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card"
import { Button } from "../../ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog"
import { formatDateTime } from "../../../lib/formatters"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Session {
  id: string
  createdAt: Date
  expiresAt: Date
  ipAddress: string | null
  userAgent: string | null
  deviceLabel: string
  location: string
}

interface AdminUserSessionsCardProps {
  userId: string
  initialSessions: Session[]
}

export default function AdminUserSessionsCard({ userId, initialSessions }: AdminUserSessionsCardProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState(initialSessions)
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false)

  const now = new Date()
  const activeSessions = sessions.filter(s => new Date(s.expiresAt) > now)
  const expiredSessions = sessions.filter(s => new Date(s.expiresAt) <= now)

  const handleRevokeAll = async () => {
    setIsRevoking(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/sessions`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to revoke sessions')
      }
      toast.success('All sessions revoked')
      setSessions(sessions.filter(s => new Date(s.expiresAt) <= now))
      setConfirmRevokeAll(false)
      router.refresh()
    } catch (error) {
      toast.error('Failed to revoke sessions')
      console.error(error)
    } finally {
      setIsRevoking(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    setIsRevoking(true)
    try {
      const response = await fetch(
        `/api/admin/users/${userId}/sessions?sessionId=${sessionId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Failed to revoke session')
      }

      toast.success('Session revoked successfully')
      setSessions(sessions.filter(s => s.id !== sessionId))
      setSessionToRevoke(null)
      router.refresh()
    } catch (error) {
      toast.error('Failed to revoke session')
      console.error(error)
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>
                {activeSessions.length} active session(s)
              </CardDescription>
            </div>
            {activeSessions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmRevokeAll(true)}
              >
                Revoke all sessions
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
              No active sessions found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="text-sm">
                        {formatDateTime(session.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(session.expiresAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {session.deviceLabel}
                      </TableCell>
                      <TableCell className="text-sm">
                        {session.location}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {session.ipAddress || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setSessionToRevoke(session.id)}
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {expiredSessions.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              {expiredSessions.length} expired session(s) not shown
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!sessionToRevoke}
        onOpenChange={() => setSessionToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will log out the device associated with this session.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToRevoke && handleRevokeSession(sessionToRevoke)}
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRevoking ? "Revoking..." : "Revoke Session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmRevokeAll} onOpenChange={setConfirmRevokeAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke all sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              Logs this account out of every device — use this if the account may be
              compromised. Cached sessions may stay valid for up to 5 minutes. The
              user can sign back in normally afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAll}
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRevoking ? "Revoking..." : "Revoke all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
