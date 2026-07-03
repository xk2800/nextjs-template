import Link from "next/link"
import LogoutButtons from "../auth/logoutButtons"

export interface DashboardNavLink {
  href: string
  label: string
  active?: boolean
}

export interface DashboardHeaderProps {
  userName: string
  brandName?: string
  brandHref?: string
  navLinks?: DashboardNavLink[]
  /**
   * Rendered before the user name — e.g. pass `<ThemeToggle />` if your
   * project uses next-themes. Omitted by default so DashboardHeader has no
   * hard dependency on next-themes (it's an optional peer of the package).
   */
  actions?: React.ReactNode
}

const defaultNavLinks: DashboardNavLink[] = [
  { href: "/dashboard", label: "Dashboard", active: true },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/", label: "Home" },
]

export default function DashboardHeader({
  userName,
  brandName = "Template",
  brandHref = "/",
  navLinks = defaultNavLinks,
  actions,
}: DashboardHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={brandHref} className="text-xl font-bold">
              {brandName}
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    link.active
                      ? "text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400 transition"
                      : "text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
                  }
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {actions}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {userName}
            </span>
            <LogoutButtons />
          </div>
        </div>
      </div>
    </header>
  )
}
