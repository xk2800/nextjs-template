'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authClient, useSession } from '../../lib/auth-client'
import { Button } from '../ui/button'

// Shown app-wide (see app/dashboard/layout.tsx) while the current session is
// an admin impersonating another user, so it's impossible to forget you're
// not looking at your own account.
export default function ImpersonationBanner() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isStopping, setIsStopping] = useState(false)

  if (!session?.session.impersonatedBy) return null

  const handleStop = async () => {
    setIsStopping(true)
    try {
      const { error } = await authClient.admin.stopImpersonating()
      if (error) throw new Error(error.message)
      router.push('/dashboard/admin/users')
      router.refresh()
    } catch (error) {
      toast.error('Failed to stop impersonating')
      console.error(error)
    } finally {
      setIsStopping(false)
    }
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      <span>
        You&apos;re viewing as <strong>{session.user.name || session.user.email}</strong>
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleStop}
        disabled={isStopping}
        className="h-7 border-amber-950/30 bg-transparent text-amber-950 hover:bg-amber-950/10"
      >
        {isStopping ? 'Stopping...' : 'Stop impersonating'}
      </Button>
    </div>
  )
}
