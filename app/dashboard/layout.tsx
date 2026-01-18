import { requireAuth } from "@/lib/auth-helpers"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import LogoutButtons from "@/components/auth/logoutButtons"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Full session validation - this is the security layer
  const session = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold">
                Template
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium hover:text-gray-600 transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
                >
                  Home
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
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
