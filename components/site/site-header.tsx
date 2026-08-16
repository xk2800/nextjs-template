import Link from "next/link"
import { headers } from "next/headers"

import { auth } from "@/server/auth"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { cn } from "@/lib/utils"
import { REPO_URL } from "@/lib/site"

const NAV_LINK_CLASS = "rounded-md px-3 py-1.5 transition-colors hover:text-foreground"
const NAV_LINK_ACTIVE_CLASS = "bg-secondary font-medium text-foreground"

export async function SiteHeader({ active }: { active?: "features" | "changelog" } = {}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-background text-sm font-bold">
            N
          </span>
          nextjs-template
        </Link>
        <nav className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
          <Link
            href="/features"
            className={cn(NAV_LINK_CLASS, active === "features" && NAV_LINK_ACTIVE_CLASS)}
          >
            Features
          </Link>
          <Link
            href="/changelog"
            className={cn(NAV_LINK_CLASS, active === "changelog" && NAV_LINK_ACTIVE_CLASS)}
          >
            Changelog
          </Link>
          <a href={REPO_URL} className={NAV_LINK_CLASS}>
            GitHub
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session?.user ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
