import Link from "next/link"
import { headers } from "next/headers"
import {
  Layers,
  Palette,
  KeyRound,
  Database,
  ShieldCheck,
  Flag,
  ArrowRight,
  ChevronRight,
} from "lucide-react"

import { auth } from "@/server/auth"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"
import packageJson from "../package.json"

const DEPENDENCY_VERSIONS: Record<string, string> = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
}

function cleanVersion(spec: string | undefined): string | null {
  return spec ? spec.replace(/^[\^~]/, "") : null
}

const FEATURES = [
  {
    icon: Layers,
    title: "Next.js 15 + Tailwind",
    description: `App Router, React 19, and TypeScript on Tailwind ${cleanVersion(DEPENDENCY_VERSIONS.tailwindcss) ?? ""}, with a strict lint and build pipeline.`,
  },
  {
    icon: Palette,
    title: "shadcn/ui components",
    description: "New York-style primitives on oklch design tokens, with light and dark parity out of the box.",
  },
  {
    icon: KeyRound,
    title: "Better-Auth + Google",
    description: "OAuth and email/password sign-in, database-backed sessions, Google One Tap ready.",
  },
  {
    icon: Database,
    title: "Postgres via Drizzle",
    description: "Separate connection configs for development, testing, and production, with reviewable SQL migrations.",
  },
  {
    icon: ShieldCheck,
    title: "Admin & impersonation",
    description: "A role-aware admin area with audit logging and safe, always-logged support impersonation.",
  },
  {
    icon: Flag,
    title: "Feature flags",
    description: "Toggle sign-up methods and maintenance mode live, from System Settings, without a redeploy.",
  },
]

const SCREENS = [
  { label: "Dashboard overview", href: "/dashboard" },
  { label: "Account settings", href: "/dashboard/settings" },
  { label: "Admin home", href: "/dashboard/admin" },
  { label: "User management", href: "/dashboard/admin/users" },
  { label: "Audit logs", href: "/dashboard/admin/activity-logs" },
  { label: "System settings", href: "/dashboard/admin/settings" },
  { label: "Sign in", href: "/login" },
  { label: "Sign up", href: "/signup" },
  { label: "Maintenance", href: "/maintenance" },
  { label: "Changelog", href: "/changelog" },
]

const PREVIEW_SESSIONS = [
  { device: "MacBook Pro · Chrome", status: "Active now", live: true },
  { device: "iPhone 16 · Safari", status: "2 hours ago", live: false },
  { device: "Windows 11 · Edge", status: "4 days ago", live: false },
]

const Home = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                v{packageJson.version} · open source
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
                A Next.js starter with auth, admin, and audit already designed.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
                Sign-in, sessions, roles, audit logs, and feature flags — wired up on Next.js,
                Drizzle, and Postgres, so you start on your product instead of your auth stack.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={session?.user ? "/dashboard" : "/signup"}>
                    Open the dashboard
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">View the sign-in flow</Link>
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-destructive/60" />
                <span className="size-2.5 rounded-full bg-yellow-500/60" />
                <span className="size-2.5 rounded-full bg-green-500/60" />
                <span className="ml-2 font-mono text-xs text-muted-foreground">/dashboard</span>
              </div>
              <div className="grid grid-cols-3 gap-px bg-border/60">
                {[
                  { label: "Users", value: "128" },
                  { label: "Sessions", value: "34" },
                  { label: "Sign-ups", value: "5" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-card px-4 py-4">
                    <p className="text-2xl font-semibold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="divide-y divide-border/60">
                {PREVIEW_SESSIONS.map((s) => (
                  <div key={s.device} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span>{s.device}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {s.live && <span className="size-1.5 animate-pulse rounded-full bg-green-500" />}
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
              <p className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
                Example data — every column here maps to a real table in{" "}
                <code className="font-mono">server/db/schema.ts</code>.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 bg-secondary/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              What&apos;s included
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              The boilerplate, without the boilerplate look.
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-xl border border-border bg-card p-5">
                  <feature.icon className="size-5 text-foreground" />
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                  Every screen, wired up
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight">Ten screens on one system.</h2>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  Jump straight into any surface — each one shares the same shell, page header,
                  spacing, and state handling.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/features">
                  See the full feature breakdown
                  <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SCREENS.map((screen) => (
                <Link
                  key={screen.href}
                  href={screen.href}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                  {screen.label}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

export default Home
