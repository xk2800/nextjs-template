# Changelog

All notable changes to `@xk2800/nextjs-template` are documented here, version by version, derived from the project's git and tag history.

> **Scope note:** this covers every tagged release from **v0.1.1** (the earliest tag in the repository — no `v0.1.0` was ever tagged) through **v0.2.4**. Tags `v0.2.5`–`v0.2.7` already exist in the repository beyond this point and are not covered here; ask if you'd like this extended to include them.

## Navigation

- [v0.2.4](#v024) · [v0.2.3](#v023) · [v0.2.2](#v022) · [v0.2.1](#v021) · [v0.2.0](#v020)
- [v0.1.13](#v0113) · [v0.1.12](#v0112) · [v0.1.11](#v0111) · [v0.1.10](#v0110) · [v0.1.9](#v019) · [v0.1.8](#v018) · [v0.1.7](#v017) · [v0.1.6](#v016) · [v0.1.5](#v015) · [v0.1.4](#v014) · [v0.1.3](#v013) · [v0.1.2](#v012) · [v0.1.1](#v011)

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
