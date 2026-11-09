"use client"

import { useRouter } from "next/navigation"
import { PanelLeft, PanelTop } from "lucide-react"

import { Button } from "../ui/button"

export type NavStyle = "sidebar" | "topbar"

export default function NavStyleToggle({ current }: { current: NavStyle }) {
  const router = useRouter()
  const next: NavStyle = current === "sidebar" ? "topbar" : "sidebar"

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        document.cookie = `nav-style=${next}; path=/; max-age=31536000; samesite=lax`
        router.refresh()
      }}
    >
      {next === "topbar" ? <PanelTop /> : <PanelLeft />}
      <span className="hidden sm:inline">
        {next === "topbar" ? "Top bar" : "Sidebar"}
      </span>
    </Button>
  )
}
