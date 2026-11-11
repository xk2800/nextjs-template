import Link from "next/link"
import { cn } from "../../lib/utils"

export const SETTINGS_TABS = [
  { value: "profile", label: "Profile" },
  { value: "security", label: "Security & sessions" },
  { value: "appearance", label: "Appearance" },
  { value: "notifications", label: "Notifications" },
] as const

export type SettingsTab = (typeof SETTINGS_TABS)[number]["value"]

// Link-based tabs: the active tab is the `?tab=` param, so only that tab's
// server components render and each tab is bookmarkable.
export function SettingsNav({ active }: { active: SettingsTab }) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b" aria-label="Settings sections">
      {SETTINGS_TABS.map(({ value, label }) => (
        <Link
          key={value}
          href={`/dashboard/settings?tab=${value}`}
          aria-current={active === value ? "page" : undefined}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            active === value
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
