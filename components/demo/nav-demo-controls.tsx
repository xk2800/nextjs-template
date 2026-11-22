"use client"

import { useRouter } from "next/navigation"
import { LayoutPanelTop } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { MobileNavVariant } from "@/components/dashboard/layout/mobile-nav"
import { MOBILE_NAV_COOKIE } from "./mobile-nav-cookie"

const OPTIONS: { value: MobileNavVariant; label: string }[] = [
  { value: "tabs", label: "Tabs" },
  { value: "dock", label: "Dock" },
  { value: "off", label: "Off" },
]

/** Demo-site only (NAV_DEMO_CONTROLS): lets a visitor try the mobile bottom bar styles. Not part of the npm package. */
export default function NavDemoControls({ current }: { current: MobileNavVariant }) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Mobile navigation style">
          <LayoutPanelTop />
          <span className="hidden sm:inline">Mobile nav</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mobile bottom bar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(value) => {
            document.cookie = `${MOBILE_NAV_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`
            router.refresh()
          }}
        >
          {OPTIONS.map(({ value, label }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
