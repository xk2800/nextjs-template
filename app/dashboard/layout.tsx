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
import MobileNav, { type MobileNavAction, type MobileNavVariant } from "@/components/dashboard/layout/mobile-nav"
import LogoutButtons from "@/components/auth/session/logout-buttons"
import { applyNavDemo } from "@/components/demo/nav-demo" // @demo

// Bottom navigation on phones (below `md`), chosen separately for each layout:
//   "tabs" — plain bar along the bottom edge
//   "dock" — floating rounded bar, with an optional raised centre button
//   "off"  — no bottom bar
// In the sidebar layout, a bottom bar ("tabs" or "dock") replaces the menu button that opens the
// sidebar on phones, and a Log out button takes its place in the header. With "off" the sidebar
// layout keeps its menu button and drawer. Desktop is not affected either way.
const MOBILE_NAV: Record<"topbar" | "sidebar", MobileNavVariant> = {
  topbar: "tabs",
  sidebar: "off",
}
// Centre button for "dock", e.g. { href: "/dashboard/scan", label: "Scan", icon: <ScanLine /> }
const MOBILE_NAV_ACTION: MobileNavAction | undefined = undefined

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

  const cookieStore = await cookies()
  const navStyle = cookieStore.get("nav-style")?.value === "topbar" ? "topbar" : "sidebar"
  let mobileNav: MobileNavVariant = MOBILE_NAV[navStyle]
  let demoMenu: React.ReactNode = null // @demo
    ; ({ mobileNav, demoMenu } = applyNavDemo(MOBILE_NAV[navStyle], cookieStore)) // @demo: template demo site only, removed by create-nextjs
  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  }
  const feedback = (config.FEEDBACK_DISCORD_WEBHOOK_URL || config.FEEDBACK_EMAIL) && <FeedbackDialog />
  const extras = (
    <>
      {demoMenu /* @demo */}
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
  const bottomBar = mobileNav !== "off"
  // Room under the content so the last row isn't hidden behind the fixed bar.
  const mobilePad = mobileNav === "dock" ? "pb-28 md:pb-0" : bottomBar ? "pb-16 md:pb-0" : ""

  if (navStyle === "topbar") {
    return (
      <>
        <TopNav
          user={user}
          isAdmin={isAdmin}
          brandName={config.APP_NAME}
          actions={extras}
          mobileNav={mobileNav}
          mobileAction={MOBILE_NAV_ACTION}
        />
        {body}
        <div className={mobilePad}>{content}</div>
      </>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} isAdmin={isAdmin} brandName={config.APP_NAME} />
      <SidebarInset>
        {body}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className={bottomBar ? "-ml-1 max-md:hidden" : "-ml-1"} />
          <Separator orientation="vertical" className={bottomBar ? "mr-2 h-4 max-md:hidden" : "mr-2 h-4"} />
          <div className="flex-1" />
          {extras}
          {/* The sidebar's footer holds Log out; the bottom bar replaces the sidebar on phones. */}
          {bottomBar && <div className="md:hidden"><LogoutButtons /></div>}
        </header>
        {bottomBar ? <div className={mobilePad}>{content}</div> : content}
      </SidebarInset>
      {bottomBar && <MobileNav isAdmin={isAdmin} variant={mobileNav} action={MOBILE_NAV_ACTION} />}
    </SidebarProvider>
  )
}
