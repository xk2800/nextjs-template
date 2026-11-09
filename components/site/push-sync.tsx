'use client'

import { useEffect } from 'react'
import { syncPush } from '@/lib/push-client'

// Renders nothing. Re-saves this device's push subscription each time the
// dashboard opens (see syncPush).
export default function PushSync() {
  useEffect(() => {
    syncPush().catch(() => {})
  }, [])
  return null
}
