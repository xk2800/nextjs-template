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
  type LucideIcon,
} from "lucide-react"

import { auth } from "@/server/auth"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"
import { WindowChrome } from "@/components/site/window-chrome"
import { FEATURES, SCREENS } from "./page-data.json"
import packageJson from "../package.json"

const FEATURE_ICONS: Record<string, LucideIcon> = { Layers, Palette, KeyRound, Database, ShieldCheck, Flag }

const HERO_FEATURES = FEATURES.slice(0, 4)

const Home = async () => {
  const session = await auth.api.getSession({ headers: await headers() })

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
              <WindowChrome label="what's inside" />
              <div className="divide-y divide-border/60">
                {HERO_FEATURES.map((feature) => {
                  const Icon = FEATURE_ICONS[feature.icon]
                  return (
                    <div key={feature.title} className="flex items-center gap-3 px-4 py-3.5 text-sm">
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium">{feature.title}</span>
                    </div>
                  )
                })}
              </div>
              <p className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
                Plus {FEATURES.length - HERO_FEATURES.length} more below.
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
              {FEATURES.map((feature) => {
                const Icon = FEATURE_ICONS[feature.icon]
                return (
                  <div key={feature.title} className="rounded-xl border border-border bg-card p-5">
                    <Icon className="size-5 text-foreground" />
                    <h3 className="mt-4 font-semibold">{feature.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                )
              })}
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
