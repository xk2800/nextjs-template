'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatDateTime } from "@/lib/formatters"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { config } from "@/config/env"

interface Session {
  id: string
  createdAt: Date
  expiresAt: Date
  ipAddress: string | null
  userAgent: string | null
  token: string
}

interface SessionsCardProps {
  userId: string
  initialSessions: Session[]
  currentSessionToken: string
}

export default function SessionsCard({
  userId,
  initialSessions,
  currentSessionToken
}: SessionsCardProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState(initialSessions)
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  const now = new Date()
  const activeSessions = sessions.filter(s => new Date(s.expiresAt) > now)
  const expiredSessions = sessions.filter(s => new Date(s.expiresAt) <= now)

  const handleRevokeSession = async (sessionId: string) => {
    setIsRevoking(true)
    try {
      const response = await fetch('/api/sessions/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

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

  const isCurrentSession = (token: string) => token === currentSessionToken

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            You have {activeSessions.length} active session(s)
          </CardDescription>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>User Agent</TableHead>
                    {config.ENABLE_SESSION_REVOCATION && (
                      <TableHead>Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((session) => {
                    const isCurrent = isCurrentSession(session.token)
                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <Badge variant={isCurrent ? "default" : "secondary"}>
                            {isCurrent ? "Current" : "Active"}
                          </Badge>
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
                        {config.ENABLE_SESSION_REVOCATION && (
                          <TableCell>
                            {!isCurrent && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setSessionToRevoke(session.id)}
                              >
                                Revoke
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Show expired sessions count if any */}
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
    </>
  )
}
