'use client'

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AdminUserDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
        We couldn&apos;t load this user&apos;s details. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
