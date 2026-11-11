'use client'

import { useEffect } from 'react'

const HEARTBEAT_INTERVAL_MS = 30_000

// Renders nothing — just keeps `users.lastActiveAt` fresh while an
// authenticated user has a dashboard tab open, so admins can see who's
// currently online (see ONLINE_THRESHOLD_MS in adminUsersPage).
export default function Heartbeat() {
  useEffect(() => {
    const ping = () => {
      fetch('/api/heartbeat', { method: 'POST' }).catch(() => {})
    }

    ping()
    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return null
}
