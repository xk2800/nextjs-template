# Changelog

All notable changes to `@xk2800/nextjs-template` are documented here, version by version, derived from the project's git and tag history.

> **Scope note:** this covers every tagged release from **v0.1.1** (the earliest tag in the repository — no `v0.1.0` was ever tagged) through **v0.3.3**, the current version.

## Navigation

- [v0.3.3](#v033) · [v0.3.2](#v032) · [v0.3.1](#v031) · [v0.3.0](#v030)
- [v0.2.7](#v027) · [v0.2.6](#v026) · [v0.2.5](#v025) · [v0.2.4](#v024) · [v0.2.3](#v023) · [v0.2.2](#v022) · [v0.2.1](#v021) · [v0.2.0](#v020)
- [v0.1.13](#v0113) · [v0.1.12](#v0112) · [v0.1.11](#v0111) · [v0.1.10](#v0110) · [v0.1.9](#v019) · [v0.1.8](#v018) · [v0.1.7](#v017) · [v0.1.6](#v016) · [v0.1.5](#v015) · [v0.1.4](#v014) · [v0.1.3](#v013) · [v0.1.2](#v012) · [v0.1.1](#v011)

---

## v0.3.3

**2026-08-10**

### Fixed
- Eight more shipped components were still using the `@/` path alias instead of relative/package-path imports — `components/ui/{switch,checkbox,textarea}.tsx`, `components/dashboard/impersonationBanner.tsx`, `components/dashboard/admin/{adminStatsGrid,adminStatsGridSkeleton,impersonationLogCard,adminUsersTable}.tsx`. `@/` only resolves inside this repo's own build (via `tsconfig.json`); once a file ships as raw source into a consumer's `node_modules`, `@/` resolves against *their* tsconfig instead and silently breaks with `Module not found`. Closes out the same bug class first partially fixed in v0.2.7.

[↑ back to top](#navigation)

---

## v0.3.2

**2026-08-10**

Version bump only, following a `dev`/`master` branch merge reconciliation — no functional changes beyond v0.3.1.

[↑ back to top](#navigation)

---

## v0.3.1

**2026-08-10**

### Fixed
- `lib/cookie-names.ts` and `lib/request-info.ts` added to the package's published `files` list. Both are relatively-imported by shipped `components/auth/*` and `components/dashboard/admin/*` components (introduced in v0.3.0) but were missing from what actually got published, breaking those imports for consumers with a `Module not found` error at build time.

[↑ back to top](#navigation)

---

## v0.3.0

**2026-08-10**

The largest release since v0.1.1 — a full admin back-office pass: per-user detail pages, live-editable system settings, impersonation auditing, and bulk/export tooling.

### Added
- **System Settings admin page** (`/dashboard/admin/settings`) — DB-backed feature flags (Google sign-in, email/password sign-in, Google One Tap, session revocation) and maintenance mode, replacing config that previously lived in env vars and needed a redeploy to change. New `system_settings` table (`server/db/schema.ts`), `lib/settings-queries.ts` (cached reads, fail-open on DB errors, lazy-seeds from existing env values so enabling this never silently flips already-deployed behavior), `/api/admin/settings` save route, public `/api/settings/public` route, and a `/maintenance` page. Auth-method flags are enforced live via a `hooks.before` guard in `server/auth.ts` covering `/sign-in/social`, `/sign-in/email`, and `/one-tap/callback` — so disabling a method takes effect immediately, not just on next deploy.
- **Per-user admin detail page** (`/dashboard/admin/users/[userId]`) — sessions, activity log, account status, and a new registration/login info card (referrer URL, OS, browser, device type, geolocation) all in one place instead of only table rows. New `activity_log` columns (`referrerUrl`, `os`, `browser`, `deviceType`, `country`, `city`) captured at login/registration time via `lib/request-info.ts` (`ua-parser-js` + `geoip-lite`, both resolved offline with no third-party network calls).
- **Impersonation logging** — admin impersonation start/stop events written to the activity log, with a dedicated `impersonationLogCard` feed on the admin users/activity pages and an always-visible `impersonationBanner` shown app-wide while impersonating.
- **Admin dashboard stats** — `getAdminDashboardStats()` and an `adminStatsGrid` summary component.
- **Bulk user actions** — bulk ban and bulk delete from the admin users table.
- **CSV export** — for both activity logs and users, from their respective admin tables.
- This `CHANGELOG.md`.

### Fixed
- OAuth login-activity tracking showed `accounts.google.com` as the referrer for Google sign-ins instead of the page the user actually came from — the OAuth round trip means the server only sees the provider's own domain on the live `referer` header at the point the session is created. Fixed by stashing the real originating page in a short-lived, same-origin cookie client-side (`lib/cookie-names.ts`) right before the redirect, read back server-side once the callback completes.
- Google One Tap could bypass the "Google sign-in disabled" setting entirely, since it hits its own `/one-tap/callback` endpoint rather than `/sign-in/social` — added a dedicated guard so disabling Google also disables One Tap.

### Changed
- Enhanced user role management in the admin users table.
- `next.config.ts`: added `serverExternalPackages: ["geoip-lite"]` — bundling it breaks its `.dat` geolocation-database file lookups at runtime.

### Dependencies
- Added `geoip-lite` and `ua-parser-js` (pinned to the last MIT-licensed `1.0.41` — v2.x relicensed to AGPL-3.0, a bad fit for a template embedded in other projects) for offline device/geolocation parsing.
- `radix-ui` (unified package) landed as a direct dependency via shadcn's `Switch`/`Textarea` additions.

[↑ back to top](#navigation)

---

## v0.2.7

**2026-08-09**

### Fixed
- **First pass at the `@/`-alias packaging bug**: `@/lib/user-queries`, `@/lib/activity-queries`, and similar `@/`-aliased imports in several shipped `components/dashboard/**` Section components were converted to package-path imports (e.g. `@xk2800/nextjs-template/users/queries`) or relative imports — these only ever resolved correctly inside this repo's own build, and broke for any consumer installing the package. (A further set of instances in different files was caught and fixed later, in v0.3.3.)
- `build` script now runs `bun run build:lib` before `next build`, so the published package's `dist/` output is never stale relative to what the app itself was built against.

### Changed
- `authClient` now unconditionally registers better-auth's `adminClient()` plugin.
- Google One Tap's client-side plugin typing reworked to derive from the plugin's own return type instead of being hand-written, so it tracks whatever better-auth version is actually installed (fixes a `getActions` type-variance mismatch on better-auth ≥1.6).

[↑ back to top](#navigation)

---

## v0.2.6

**2026-08-09**

Version bump only — no functional changes.

[↑ back to top](#navigation)

---

## v0.2.5

**2026-08-09**

Version bump only — no functional changes.

[↑ back to top](#navigation)

---

## v0.2.4

**2026-08-09**

### Added
- `callbackURL` prop on the `OneTap` component, so consumers can customize where Better-Auth redirects after a successful One Tap sign-in instead of always landing on `/dashboard`.

[↑ back to top](#navigation)

---

## v0.2.3

**2026-08-09**

### Fixed
- Corrected the import path for `authClient` in the `OneTap` component (it was resolving incorrectly after earlier refactors).

[↑ back to top](#navigation)

---

## v0.2.2

**2026-08-09**

Version bump only — no functional changes.

[↑ back to top](#navigation)

---

## v0.2.1

**2026-08-09**

### Added
- `types/auth` added to the package's published `files` list, so consumers importing `@xk2800/nextjs-template/types/auth/*` actually receive those type declarations (previously missing from the publish output).

### Changed
- `bump-version` script now defaults the "publish to GitHub Packages" prompt to `true`.

[↑ back to top](#navigation)

---

## v0.2.0

**2026-08-09**

Minor version bump marking the v0.1.13 feature set (One Tap auth, heartbeat/online status, admin dashboard error/loading states — see below) as a significant milestone. No additional functional changes beyond the version bump itself.

[↑ back to top](#navigation)

---

## v0.1.13

**2026-08-09**

The largest release in the v0.1.x series — rounds out the admin dashboard and adds a second sign-in method's UX polish.

### Added
- **Google One Tap authentication** — new `components/auth/oneTap.tsx`, gated behind configurable `AUTH_ENABLE_ONE_TAP` / `NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP` flags.
- **Heartbeat / online status** — new `app/api/heartbeat/route.ts` and `components/dashboard/heartbeat.tsx`, so the dashboard can show whether a user is currently active.
- **Error boundaries and loading states** across the dashboard: new `error.tsx`/`loading.tsx` for the dashboard root, admin activity logs, and admin users pages, plus a shared `components/error-boundary.tsx` and `sectionErrorFallback.tsx`.
- **Admin users table** — `components/dashboard/admin/adminUsersTable.tsx`, `usersSection.tsx`, and `adminUsersSkeleton.tsx`, backed by a new `lib/user-queries.ts`.
- **Admin activity logs table** — `adminActivityLogsTable.tsx`, `adminActivityLogsSkeleton.tsx`, `activityLogsSection.tsx` (admin variant).
- Two new Drizzle migrations (`0004`, `0005`) supporting the above.
- Release-notes generation added to `scripts/bump-version.ts`, so GitHub Releases get an auto-generated body from the commit log.

### Fixed
- Stale requests and incorrect loading-state handling in `adminActivityLogsTable` during log fetches.
- Unhandled error when updating `lastLoginAt` during session refresh.

[↑ back to top](#navigation)

---

## v0.1.12

**2026-08-01**

### Dependencies
- `next` 16.2.7 → 16.2.12
- `eslint-config-next` 16.2.7 → 16.2.12

[↑ back to top](#navigation)

---

## v0.1.11

**2026-08-01**

Introduces email/password as a fully independent sign-in method alongside Google OAuth, plus the first admin-facing activity log surface.

### Added
- **Email & password authentication** — new `app/(auth)/signup/page.tsx`, `emailPasswordLogin.tsx`, `emailPasswordSignup.tsx` components, and `types/auth/signupSchema.ts`.
- **Per-project auth toggles** — `AUTH_ENABLE_GOOGLE` and `AUTH_ENABLE_EMAIL_PASSWORD` env vars (both default **on**), so a consuming project can turn either sign-in method off without forking `server/auth.ts`.
- **Admin activity logs** — `app/api/admin/activity-logs/route.ts` and `app/dashboard/admin/activity-logs/` page.
- `scripts/bump-version.ts` — the first version of the automated version-bump/publish script.
- New Drizzle migration `0003`.

### Changed
- Callback URL handling centralized into `lib/auth-helpers.ts` (`normalizeCallbackUrl`), replacing ad-hoc normalization that was duplicated in the login and signup pages — closes an open-redirect risk from unvalidated `callbackUrl` query params.
- `docs/content/architecture.mdx` and `authentication.mdx` updated to document the new auth flags and custom-provider handling in `createAuth()`.

### Fixed
- Boolean transformation bug in the auth-flag environment schema (`AUTH_ENABLE_GOOGLE`/`AUTH_ENABLE_EMAIL_PASSWORD` weren't parsing correctly in some cases).
- `AuthCard` import corrected to a default import.

[↑ back to top](#navigation)

---

## v0.1.10

**2026-07-25**

### Added
- `PUBLISHING.md` — a full guide for publishing this package to GitHub Packages, plus `repository`/`publishConfig` fields in `package.json`.

[↑ back to top](#navigation)

---

## v0.1.9

**2026-07-03**

Version bump only — no functional changes.

[↑ back to top](#navigation)

---

## v0.1.8

**2026-07-03**

### Changed
- `DashboardHeaderProps.userName` made optional; `brandName` typing improved.

[↑ back to top](#navigation)

---

## v0.1.7

**2026-07-03**

### Added
- **Doppler secrets management support** — `bun run dev:doppler` / `build:doppler` / `migrate:doppler` etc., documented in `CLAUDE.md`/`README.md`.
- New `components/dashboard/dashboardHeader.tsx`.

### Changed
- Dashboard layout refactored to use the new header component.

[↑ back to top](#navigation)

---

## v0.1.6

**2026-07-03**

### Changed
- **Dashboard components relocated** from `app/dashboard/components/` to `components/dashboard/` (`accountDetailsCard`, `activityLogsCard`, `adminSection`, `profileCard`, `sessionsCard`) — the previous location wasn't reachable by the package's `files`/`exports`, so consumers installing the npm package couldn't actually get these components until this move.
- `tsup.config.ts` / `tsconfig.build.json` updated for the new paths.

### Added
- `lib/admin-queries.ts`.

[↑ back to top](#navigation)

---

## v0.1.5

**2026-07-03**

### Added
- Tailwind theme support via `styles/theme.css`, published as `@xk2800/nextjs-template/styles/theme.css`.

[↑ back to top](#navigation)

---

## v0.1.4

**2026-07-03**

Version bump only — no functional changes.

[↑ back to top](#navigation)

---

## v0.1.3

**2026-07-03**

### Fixed
- `lib/utils.ts` and `lib/auth-client.ts` added to the package's published `files` list — both were used internally but missing from what actually got published, breaking consumer imports.

[↑ back to top](#navigation)

---

## v0.1.2

**2026-07-03**

### Changed
- Database connection handling and migration instructions clarified in `README.md`.

[↑ back to top](#navigation)

---

## v0.1.1

**2026-07-03**

The first tagged release. Establishes the whole baseline this project builds on, and converts it from a plain Next.js app into a publishable scoped npm package.

### Added
- Next.js + TypeScript + Tailwind CSS project scaffold with shadcn/ui.
- PostgreSQL support via Drizzle ORM (`pg` driver), plus a `test-connection` script.
- Google OAuth login.
- **Migration from NextAuth to Better-Auth** for authentication (session strategy, adapters, and the `password` field added to the user schema for credential accounts).
- `middleware.ts` for dashboard route protection.
- Initial activity logs feature.
- Email sending via the Resend API, with an email template component.
- A `/changelog` page and update-notification modal (the predecessor of this document's in-app counterpart).
- `docs/` — a Nextra-based documentation site (architecture, authentication, components, database).
- `Dockerfile` and Docker-based Postgres connection support.
- **Package publishing groundwork**: `.gitignore` updated for `.npmrc`/`/dist`, `tsconfig.build.json` + `tsup.config.ts` added, `package.json` reconfigured to publish as a scoped package (`@xk2800/nextjs-template`), `authCard`/`socialLogin` split into dedicated components, `LoginSchema` (Zod) added.

### Dependencies
- Next.js upgraded across the 15.3 → 16.0 line, landing on 16.0.9 by this tag.
- Zod 3 → 4.1.12.
- `dotenv`, `@paralleldrive/cuid2`, `eslint-config-next`, `lucide-react`, `drizzle-orm`, and `@types/node` updated to their contemporary versions.

[↑ back to top](#navigation)
