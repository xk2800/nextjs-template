"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { cn } from "../../../lib/utils"
import { adminLinks, workspaceLinks } from "./app-sidebar"

/** "tabs": plain bar fixed to the bottom edge. "dock": floating rounded bar, with an optional raised centre button. "off": no bottom bar. */
export type MobileNavVariant = "tabs" | "dock" | "off"

/** The dock's centre button, e.g. `{ href: "/dashboard/scan", label: "Scan", icon: <ScanLine /> }`. */
export type MobileNavAction = {
  href: string
  label: string
  icon: React.ReactNode
}

/** Bottom navigation below `md`. Inside /dashboard/admin it switches to the admin links plus an Exit tab. */
export default function MobileNav({
  isAdmin,
  variant = "tabs",
  action,
}: {
  isAdmin: boolean
  variant?: MobileNavVariant
  action?: MobileNavAction
}) {
  const pathname = usePathname()
  const inAdmin = isAdmin && pathname.startsWith("/dashboard/admin")
  const tabs = inAdmin
    ? [...adminLinks, { href: "/dashboard", label: "Exit", icon: ArrowLeft, exit: true }]
    : isAdmin
      ? [...workspaceLinks, { ...adminLinks[0], label: "Admin" }]
      : workspaceLinks
  const tabActive = (href: string, exit?: boolean) =>
    !exit &&
    (href === "/dashboard" || href === adminLinks[0].href
      ? pathname === href
      : pathname.startsWith(href))
  const dock = variant === "dock"
  if (variant === "off") return null

  const renderTab = ({ href, label, icon: Icon, ...rest }: (typeof tabs)[number]) => {
    const active = tabActive(href, "exit" in rest)
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-w-0 flex-1 flex-col items-center justify-start gap-0.5 px-1 text-center leading-tight text-muted-foreground",
          dock ? "gap-1 py-2.5 text-xs" : "py-2 text-[11px]",
          active && "font-medium text-foreground"
        )}
      >
        <Icon className={dock ? "size-6" : "size-5"} />
        <span className="w-full truncate text-center">{label}</span>
      </Link>
    )
  }

  // The centre button sits in the middle, so split the tabs around it (extra tab goes left).
  const half = Math.ceil(tabs.length / 2)
  const centre = dock && action && (
    <Link
      key="action"
      href={action.href}
      aria-label={action.label}
      className="mx-1 flex size-14 shrink-0 items-center justify-center self-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95 [&_svg]:size-6"
    >
      {action.icon}
    </Link>
  )

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed z-20 flex md:hidden",
        dock
          ? "inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] items-stretch rounded-3xl border bg-background/95 px-2 py-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
          : "inset-x-0 bottom-0 border-t bg-background pb-[env(safe-area-inset-bottom)]"
      )}
    >
      {centre
        ? [...tabs.slice(0, half).map(renderTab), centre, ...tabs.slice(half).map(renderTab)]
        : tabs.map(renderTab)}
    </nav>
  )
}
