import { headers } from "next/headers"
import Link from "next/link"
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import { getClientIp, parseUserAgent, lookupGeoLocation, formatDeviceInfo, formatLocation } from "@/lib/request-info"
import { formatDateTime } from "@/lib/formatters"
import packageJson from "../../package.json"
import CopyInstallButton from "./_components/CopyInstallButton"
import RevealOnScroll from "./_components/RevealOnScroll"
import styles from "./page.module.css"

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--ibm-plex-sans",
  display: "swap",
})
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--ibm-plex-mono",
  display: "swap",
})

export const metadata = {
  title: "@xk2800/nextjs-template — auth, admin, and audit trail, already built",
  description:
    "A Next.js + Drizzle + Postgres starter with sign-in, an admin back office, audit logging, and live feature flags already wired up.",
}

const REPO_URL = "https://github.com/xk2800/nextjs-template"
const DOCS_URL = `${REPO_URL}/tree/master/docs`
const INSTALL_COMMAND = "bun add @xk2800/nextjs-template"

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

  return (
    <div className={`${styles.page} ${plexSans.variable} ${plexMono.variable}`}>
      <div className={styles.gridBg} aria-hidden="true" />

      <header className={styles.siteHeader}>
        <div className={`${styles.wrap} ${styles.headerRow}`}>
          <a className={styles.logo} href="#top">
            <span className={styles.logoGlyph}>&gt;</span>nextjs-template
          </a>
          <nav className={styles.headerNav} aria-label="Primary">
            <a href={REPO_URL}>GitHub</a>
            <a href={DOCS_URL}>Docs</a>
            <Link href="/changelog">Changelog</Link>
          </nav>
          <span className={styles.versionTag}>v{packageJson.version}</span>
        </div>
      </header>

      <main id="top">
        <section className={`${styles.hero} ${styles.wrap}`}>
          <div>
            <p className={styles.promptLine}>
              <span>
                <span className={styles.promptSign}>$</span> {INSTALL_COMMAND}
                <span className={styles.cursor} aria-hidden="true" />
              </span>
              <CopyInstallButton command={INSTALL_COMMAND} className={styles.copyBtn} />
            </p>
            <h1 className={styles.h1}>Auth and an admin back office, already built.</h1>
            <p className={styles.lede}>
              Google + email sign-in, a full user-management dashboard, audit logging with device and
              location tracking, and live feature flags — running on Next.js, Drizzle, and Postgres,
              ready before you write your first page.
            </p>
            <div className={styles.heroCtas}>
              <a className={`${styles.btn} ${styles.btnPrimary}`} href={REPO_URL}>
                View on GitHub
              </a>
              <a className={`${styles.btn} ${styles.btnGhost}`} href={DOCS_URL}>
                Read the docs
              </a>
            </div>
          </div>

          <div
            className={styles.exhibitCard}
            aria-label="A live example of what this template's login tracker just captured about your visit"
          >
            <div className={styles.exhibitHead}>
              <span className={styles.exhibitTitle}>Registration &amp; Login Info</span>
              <span className={styles.exhibitSub}>captured live, from this request</span>
            </div>
            <dl className={styles.exhibitRows}>
              <div className={styles.exhibitRow}>
                <dt>device</dt>
                <dd>{deviceLabel}</dd>
              </div>
              <div className={styles.exhibitRow}>
                <dt>location</dt>
                <dd>{locationLabel}</dd>
              </div>
              <div className={styles.exhibitRow}>
                <dt>referrer</dt>
                <dd>{referrer || "direct visit"}</dd>
              </div>
              <div className={styles.exhibitRow}>
                <dt>ip address</dt>
                <dd>{ip || "unavailable"}</dd>
              </div>
              <div className={styles.exhibitRow}>
                <dt>captured at</dt>
                <dd>{capturedAt}</dd>
              </div>
            </dl>
            <p className={styles.exhibitFoot}>
              This is what the template records for every real sign-in — running live on your visit to
              this page, not a mockup.
            </p>
          </div>
        </section>

        <div className={`${styles.stackLine} ${styles.wrap}`}>
          {STACK.map((s) => (
            <span key={s.label}>
              {s.label}
              {s.version ? ` ${s.version}` : ""}
            </span>
          ))}
        </div>

        <section className={`${styles.ledger} ${styles.wrap}`} aria-label="Features">
          <div className={styles.ledgerIntro}>
            <p className={styles.ledgerEyebrow}>server/drizzle/*.sql, ordered</p>
            <h2>Everything shipped, in the order it landed.</h2>
            <p>
              This template tracks its own growth the same way it expects you to track your schema —
              numbered, one capability at a time. Here&apos;s what&apos;s already in place.
            </p>
          </div>

          {RECORDS.map((record) => (
            <RevealOnScroll key={record.id} className={styles.record} visibleClassName={styles.isVisible}>
              <div>
                <div className={styles.recordMeta}>
                  <span className={styles.recordId}>{record.id}</span>
                  <span className={styles.recordStatus}>shipped</span>
                </div>
                <div className={styles.recordBody}>
                  <h3>{record.title}</h3>
                  <p>{record.tagline}</p>
                </div>
              </div>
              <ul className={styles.recordList}>
                {record.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </RevealOnScroll>
          ))}
        </section>

        <section className={`${styles.ctaBand} ${styles.wrap}`}>
          <h2>Clone it, migrate it, ship it.</h2>
          <p>The scaffolding is done. Bring the product.</p>
          <div className={styles.heroCtas}>
            <a className={`${styles.btn} ${styles.btnPrimary}`} href={REPO_URL}>
              Get the template
            </a>
            <Link className={`${styles.btn} ${styles.btnGhost}`} href="/changelog">
              See what&apos;s new
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.siteFooter}>
        <div className={`${styles.wrap} ${styles.footerRow}`}>
          <span>
            @xk2800/nextjs-template <span className={styles.versionTag}>v{packageJson.version}</span>
          </span>
          <nav aria-label="Footer">
            <a href={REPO_URL}>GitHub</a>
            <a href={DOCS_URL}>Docs</a>
            <Link href="/changelog">Changelog</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
