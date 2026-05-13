import { requireAuth } from "@/lib/auth-helpers"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import LogoutButtons from "@/components/auth/logoutButtons"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Full session validation - this is the security layer
  const session = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Dashboard Header */}
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold">
                Template
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400 transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
                >
                  Settings
                </Link>
                <Link
                  href="/"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
                >
                  Home
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {session.user.name}
              </span>
              <LogoutButtons />
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
