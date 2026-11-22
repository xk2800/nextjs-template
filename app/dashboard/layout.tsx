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

// Bottom navigation on phones (below `md`):
//   "tabs" — plain bar along the bottom edge, top-bar layout only (sidebar layout uses its menu button)
//   "dock" — floating rounded bar, in both layouts, with an optional raised centre button.
//            It is then the only mobile navigation: the sidebar layout's menu button is hidden
//            below `md` and a Log out button takes its place in the header.
//   "off"  — no bottom bar
const MOBILE_NAV: MobileNavVariant = "tabs"
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
  let mobileNav: MobileNavVariant = MOBILE_NAV
  let demoMenu: React.ReactNode = null // @demo
  ;({ mobileNav, demoMenu } = applyNavDemo(MOBILE_NAV, cookieStore)) // @demo: template demo site only, removed by create-nextjs
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
  const dock = mobileNav === "dock"
  // Room under the content so the last row isn't hidden behind the fixed bar
  // ("tabs" only shows in the top-bar layout).
  const mobilePad = dock
    ? "pb-28 md:pb-0"
    : mobileNav === "tabs" && navStyle === "topbar"
      ? "pb-16 md:pb-0"
      : ""

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
          <SidebarTrigger className={dock ? "-ml-1 max-md:hidden" : "-ml-1"} />
          <Separator orientation="vertical" className={dock ? "mr-2 h-4 max-md:hidden" : "mr-2 h-4"} />
          <div className="flex-1" />
          {extras}
          {/* The sidebar's footer holds Log out; the dock replaces the sidebar on phones. */}
          {dock && <div className="md:hidden"><LogoutButtons /></div>}
        </header>
        {dock ? <div className={mobilePad}>{content}</div> : content}
      </SidebarInset>
      {dock && <MobileNav isAdmin={isAdmin} variant="dock" action={MOBILE_NAV_ACTION} />}
    </SidebarProvider>
  )
}
