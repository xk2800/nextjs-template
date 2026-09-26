import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { CookieSettingsButton } from "@/components/site/cookie-banner"
import { DOCS_URL, REPO_URL } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="font-semibold">nextjs-template</p>
          <p className="text-sm text-muted-foreground">
            Auth, admin, and audit — redesigned for this project.
          </p>
        </div>
        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link href="/features" className="transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="/changelog" className="transition-colors hover:text-foreground">
            Changelog
          </Link>
          <a href={DOCS_URL} className="transition-colors hover:text-foreground">
            Docs
          </a>
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <CookieSettingsButton className="cursor-pointer transition-colors hover:text-foreground" />
          <a href={REPO_URL} className="flex items-center gap-1.5 transition-colors hover:text-foreground">
            <ExternalLink className="size-4" />
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}
