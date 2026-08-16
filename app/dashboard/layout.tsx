import { requireAuth, hasRole } from "@/lib/auth-helpers"
import { getSystemSettings } from "@/lib/settings-queries"
import { redirect } from "next/navigation"
import AppSidebar from "@/components/dashboard/appSidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import Heartbeat from "@/components/dashboard/heartbeat"
import ImpersonationBanner from "@/components/dashboard/impersonationBanner"

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

  // Non-admins get bounced to a static maintenance page while it's on;
  // admins pass through so they can reach /dashboard/admin/settings to turn
  // it back off. This only covers the dashboard tree — see
  // lib/settings-queries.ts's getSystemSettings() if you want broader
  // (e.g. marketing-page) coverage in your own layouts.
  const settings = await getSystemSettings()
  if (settings.maintenanceMode && !isAdmin) {
    redirect('/maintenance')
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
        isAdmin={isAdmin}
      />
      <SidebarInset>
        <Heartbeat />
        <ImpersonationBanner />
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1" />
          <ThemeToggle />
        </header>

        {/* Dashboard Content */}
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
