"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"

import { authClient } from "../../../lib/auth/client"
import { cn } from "../../../lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import { Button } from "../../ui/button"
import { adminLinks, workspaceLinks, type AppSidebarProps } from "./app-sidebar"
import MobileNav, { type MobileNavAction, type MobileNavVariant } from "./mobile-nav"

export default function TopNav({
  user,
  isAdmin,
  brandName = "Template",
  brandHref = "/",
  actions,
  mobileNav = "tabs",
  mobileAction,
}: AppSidebarProps & {
  actions?: React.ReactNode
  /** Bottom navigation style below `md`. */
  mobileNav?: MobileNavVariant
  /** Optional centre button for the "dock" style. */
  mobileAction?: MobileNavAction
}) {
  const pathname = usePathname()
  const links = isAdmin ? [...workspaceLinks, ...adminLinks] : workspaceLinks
  return (
    <>
    <header className="sticky top-0 z-20 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={brandHref} className="font-semibold">
          {brandName}
        </Link>
        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto text-sm md:flex">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground",
                pathname === href && "bg-secondary font-medium text-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 md:ml-0">{actions}</div>
        <Avatar className="size-7">
          <AvatarImage src={user.image ?? undefined} alt={user.name} />
          <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Log out"
          onClick={() =>
            authClient.signOut({
              fetchOptions: { onSuccess: () => { window.location.href = "/" } },
            })
          }
        >
          <LogOut />
        </Button>
      </div>
    </header>
    <MobileNav isAdmin={isAdmin} variant={mobileNav} action={mobileAction} />
    </>
  )
}
