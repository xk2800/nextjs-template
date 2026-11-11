import { requireAuth, hasRole } from "@/lib/auth/helpers"
import AppSidebar from "@/components/dashboard/layout/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import Heartbeat from "@/components/dashboard/common/heartbeat"
import ImpersonationBanner from "@/components/dashboard/layout/impersonation-banner"
import FeedbackDialog from "@/components/dashboard/common/feedback-dialog"
import { ErrorFeedbackHost } from "@/components/dashboard/common/error-feedback"
import { config } from "@/config/env"
import { cookies } from "next/headers"
import TopNav from "@/components/dashboard/layout/top-nav"
import NavStyleToggle from "@/components/dashboard/layout/nav-style-toggle"

// Every route under /dashboard is session-gated and reads live, per-user
// data (auth, activity logs, system settings) — none of it is ever safe to
// prerender. Without this, `next build` still tries to statically render
// these pages, which hits the DB at build time; if the DB is unreachable
// from wherever the build runs, the build itself fails.
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Full session validation - this is the security layer
  const session = await requireAuth()
  const isAdmin = hasRole(session.user.role, 'admin')
  // Maintenance mode is enforced site-wide in proxy.ts.

  const navStyle =
    (await cookies()).get("nav-style")?.value === "topbar" ? "topbar" : "sidebar"
  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  }
  const feedback = (config.FEEDBACK_DISCORD_WEBHOOK_URL || config.FEEDBACK_EMAIL) && <FeedbackDialog />
  const extras = (
    <>
      <NavStyleToggle current={navStyle} />
      {feedback}
      <ThemeToggle />
    </>
  )
  const body = (
    <>
      <Heartbeat />
      <ImpersonationBanner />
      {(config.FEEDBACK_DISCORD_WEBHOOK_URL || config.FEEDBACK_EMAIL) && <ErrorFeedbackHost />}
    </>
  )
  const content = (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
  )

  if (navStyle === "topbar") {
    return (
      <>
        <TopNav user={user} isAdmin={isAdmin} actions={extras} />
        {body}
        <div className="pb-16 md:pb-0">{content}</div>
      </>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} isAdmin={isAdmin} />
      <SidebarInset>
        {body}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1" />
          {extras}
        </header>
        {content}
      </SidebarInset>
    </SidebarProvider>
  )
}
