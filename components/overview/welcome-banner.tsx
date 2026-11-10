"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const KEY = "overview-welcome-dismissed"

// Remove this component (and its line in app/dashboard/page.tsx) once onboarded.
export function WelcomeBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      setShow(localStorage.getItem(KEY) !== "1")
    } catch {
      setShow(true)
    }
  }, [])

  if (!show) return null

  const dismiss = () => {
    setShow(false)
    try {
      localStorage.setItem(KEY, "1")
    } catch {}
  }

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">Welcome to your new app</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This overview is placeholder content in <code>app/dashboard/page.tsx</code>. Run{" "}
            <code>bun run doctor</code> to check your environment, then replace the widgets with your own.
          </p>
          <Button asChild variant="link" className="mt-1 h-auto p-0">
            <Link href="/dashboard/settings?tab=profile">Manage your profile</Link>
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={dismiss} aria-label="Dismiss">
          <X />
        </Button>
      </CardContent>
    </Card>
  )
}
