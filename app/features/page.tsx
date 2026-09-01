import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

import { getClientIp, parseUserAgent, lookupGeoLocation, formatDeviceInfo, formatLocation } from "@/lib/request-info"
import { formatDateTime } from "@/lib/formatters"
import { headers } from "next/headers"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"
import { DOCS_URL, INSTALL_COMMAND, REPO_URL } from "@/lib/site"
import packageJson from "../../package.json"
import CopyInstallButton from "./_components/CopyInstallButton"
import RevealOnScroll from "./_components/RevealOnScroll"

export const metadata = {
  title: "@xk2800/nextjs-template — auth, admin, and audit trail, already built",
  description:
    "A Next.js + Drizzle + Postgres starter with sign-in, an admin back office, audit logging, and live feature flags already wired up.",
}

const DEPENDENCY_VERSIONS: Record<string, string> = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
}

function cleanVersion(spec: string | undefined): string | null {
  return spec ? spec.replace(/^[\^~]/, "") : null
}

const STACK = [
  { label: "next.js", version: cleanVersion(DEPENDENCY_VERSIONS.next) },
  { label: "react", version: cleanVersion(DEPENDENCY_VERSIONS.react) },
  { label: "typescript", version: cleanVersion(DEPENDENCY_VERSIONS.typescript) },
  { label: "tailwind css", version: cleanVersion(DEPENDENCY_VERSIONS.tailwindcss) },
  { label: "drizzle orm", version: cleanVersion(DEPENDENCY_VERSIONS["drizzle-orm"]) },
  { label: "better-auth", version: cleanVersion(DEPENDENCY_VERSIONS["better-auth"]) },
]

const RECORDS = [
  {
    id: "0001",
    title: "Authentication",
    tagline: "Sign-in, wired up and hardened before you touch it.",
    items: [
      "Google OAuth and email/password, toggled independently per deployment",
      "Optional Google One Tap prompt",
      "bcrypt-hashed credentials, DB-backed sessions with a 5-minute cookie cache",
      "Open-redirect-safe callback URLs on every login and signup route",
      "Role-based access — user and admin, enforced at the layout level",
      "Self-serve password reset — emailed link, single-use token, no support ticket",
    ],
  },
  {
    id: "0002",
    title: "Admin dashboard",
    tagline: "A real back office, not just a route behind a login check.",
    items: [
      "Searchable, paginated user table — ban, promote, delete, one click",
      "Bulk ban, bulk delete, and CSV export for the whole user list",
      "Per-user detail page: sessions, activity log, and account status, one screen",
      "Live online/offline indicator via a lightweight heartbeat endpoint",
    ],
  },
  {
    id: "0003",
    title: "Audit & impersonation",
    tagline: "Every sign-in and every admin action leaves a record.",
    items: [
      "Activity log with search, action, and date-range filters, plus CSV export",
      "Admin impersonation, logged on start and stop, with an always-visible banner",
      "Every login captures OS, browser, device type, and city/country — offline, no third-party calls",
      "Referrer tracking survives the round trip through Google's OAuth redirect",
      "New-device sign-in alerts — a client-side device fingerprint flags any device an account hasn't used before and emails the user, instead of noisy IP/user-agent matching",
    ],
  },
  {
    id: "0004",
    title: "Live system settings",
    tagline: "Flip a switch instead of shipping a deploy.",
    items: [
      "Turn Google, email/password, or One Tap sign-in on or off, live",
      "Maintenance mode with a custom message — admins keep access, everyone else doesn't",
      "Changes take effect within seconds, cached, and fail open if the database hiccups",
      "Every settings change is itself written to the activity feed",
    ],
  },
  {
    id: "0005",
    title: "Data layer",
    tagline: "Typed schema, real migrations, no ORM guesswork.",
    items: [
      "Drizzle ORM over Postgres — self-hosted for dev, Neon serverless in production",
      "Versioned SQL migrations, generated and reviewable, never run blind",
      "Zod-validated environment config, kept separate for dev, prod, and test",
      "Drizzle Studio wired up for local inspection out of the box",
      "TLS toggle for self-hosted Postgres — one DATABASE_SSL env var, no code changes for managed hosts that require it",
    ],
  },
  {
    id: "0006",
    title: "Developer experience",
    tagline: "The template ships itself, too.",
    items: [
      "Published as an installable package — import auth, schema, and admin components directly",
      "Doppler secrets management, or plain .env files — your choice",
      "Docker support out of the box",
      "A versioned changelog and an automated release script",
    ],
  },
  {
    id: "0007",
    title: "Data display",
    tagline: "A table that adapts to its container, not the other way around.",
    items: [
      "Responsive DataTable — overflowing columns collapse into an expandable per-row detail panel instead of forcing horizontal scroll",
      "Per-column sticky and minimum-width control, with a configurable collapse breakpoint",
      "Fully generic over your own row type — see it live at /dashboard/data-table",
    ],
  },
]

export default async function FeaturesPage() {
  // This isn't mock data — it's the same lib/request-info.ts parsing used by
  // the real login-activity tracker (see server/auth.ts), run live against
  // *your* request, right now. Nothing here is stored or sent anywhere; it's
  // rendered once, into this response, for you.
  const h = await headers()
  const ip = getClientIp(h)
  const userAgent = h.get("user-agent")
  const referrer = h.get("referer")
  const device = parseUserAgent(userAgent)
  const geo = lookupGeoLocation(ip)
  const deviceLabel = formatDeviceInfo(device)
  const locationLabel = formatLocation(geo)
  const capturedAt = formatDateTime(new Date())

  const exhibitRows = [
    { label: "device", value: deviceLabel },
    { label: "location", value: locationLabel },
    { label: "referrer", value: referrer || "direct visit" },
    { label: "ip address", value: ip || "unavailable" },
    { label: "captured at", value: capturedAt },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader active="features" />

      <main>
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-1.5">
                <span className="font-mono text-xs text-muted-foreground">$ {INSTALL_COMMAND}</span>
                <CopyInstallButton
                  command={INSTALL_COMMAND}
                  className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground data-[copied]:border-green-500 data-[copied]:text-green-500"
                />
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
                Auth and an admin back office, already built.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
                Google + email sign-in, a full user-management dashboard, audit logging with device
                and location tracking, and live feature flags — running on Next.js, Drizzle, and
                Postgres, ready before you write your first page.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <a href={REPO_URL}>View on GitHub</a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href={DOCS_URL}>Read the docs</a>
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-destructive/60" />
                <span className="size-2.5 rounded-full bg-yellow-500/60" />
                <span className="size-2.5 rounded-full bg-green-500/60" />
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  registration &amp; login info
                </span>
              </div>
              <dl className="divide-y divide-border/60 px-4">
                {exhibitRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <dt className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                      {row.label}
                    </dt>
                    <dd className="truncate text-right font-mono">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
                This is what the template records for every real sign-in — captured live from your
                visit to this page, not a mockup.
              </p>
            </div>
          </div>

          <div className="mt-14 flex flex-wrap gap-2 border-t border-border/60 pt-8">
            {STACK.map((s) => (
              <Badge key={s.label} variant="outline" className="font-mono">
                {s.label}
                {s.version ? ` ${s.version}` : ""}
              </Badge>
            ))}
          </div>
        </section>

        <section className="border-t border-border/60 bg-secondary/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
            <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              server/drizzle/*.sql, ordered
            </span>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight">
              Everything shipped, in the order it landed.
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              This template tracks its own growth the same way it expects you to track your
              schema — numbered, one capability at a time.
            </p>

            <div className="mt-10">
              {RECORDS.map((record) => (
                <RevealOnScroll
                  key={record.id}
                  className="grid gap-6 border-t border-border/60 py-8 opacity-0 translate-y-3.5 transition-all duration-500 ease-out last:border-b sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-10 lg:py-10"
                  visibleClassName="!opacity-100 !translate-y-0"
                >
                  <div>
                    <div className="flex items-baseline gap-2 font-mono">
                      <span className="text-sm font-semibold text-muted-foreground">{record.id}</span>
                      <span className="text-[11px] tracking-wide text-muted-foreground/70 uppercase">
                        shipped
                      </span>
                    </div>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">{record.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{record.tagline}</p>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {record.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Clone it, migrate it, ship it.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              The scaffolding is done. Bring the product.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <a href={REPO_URL}>Get the template</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/changelog">See what&apos;s new</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
