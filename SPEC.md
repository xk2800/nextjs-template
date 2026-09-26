# Spec Sheet — @xk2800/nextjs-template

Version `0.5.0` · A production-oriented Next.js starter/template that also publishes itself as a private, installable npm package (`@xk2800/nextjs-template` on GitHub Packages). Consuming projects can either fork the whole repo or `bun add` the package and import individual pieces.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.3.0 (App Router, Turbopack dev server) |
| UI library | React 19 |
| Language | TypeScript 6 |
| Styling | Tailwind CSS 4 + `tw-animate-css` |
| Components | Shadcn/ui (Radix UI primitives, `class-variance-authority`, `clsx`, `tailwind-merge`) |
| Icons | `lucide-react`, `react-icons` |
| Theming | `next-themes` (light/dark toggle, optional peer dep) |
| ORM | Drizzle ORM 0.45 + `drizzle-kit` |
| Database | PostgreSQL — self-hosted `pg` driver for dev/Docker, `@neondatabase/serverless` for production (Neon), switchable via `DB_DRIVER` |
| Auth | Better-Auth 1.3.34 (database-backed sessions, not JWT-only) |
| Password hashing | bcrypt (10 rounds) |
| ID generation | `@paralleldrive/cuid2` |
| Email | Resend + `@react-email/components` (optional peer deps) |
| Toasts | `sonner` (optional peer dep) |
| Device/geo parsing | `ua-parser-js`, `geoip-lite` |
| Validation | Zod 4 |
| Runtime / package manager | Bun (dev/scripts), Node.js runtime in production |
| Secrets | `.env.*` files, or Doppler as an opt-in alternative (`*:doppler` scripts) |
| Library bundler | `tsup` (for the publishable package build) |
| Deployment | Docker (`Dockerfile`), designed for Dokploy-style VPS deploys |
| Docs site | Separate Next.js app under `docs/` |

---

## 2. Architecture Overview

```
app/                  Next.js App Router routes (pages, layouts, API routes)
components/           UI components (shadcn primitives, auth, dashboard, email, site)
server/
  ├─ auth.ts          createAuth() factory + default `auth` singleton (Better-Auth)
  ├─ db/
  │   ├─ schema.ts    Drizzle schema (users, sessions, accounts, verifications, activity_log, system_settings)
  │   └─ index.ts      DB connection (pg or neon, chosen via DB_DRIVER)
  └─ test-connection/ Standalone DB connectivity check script
config/env.ts         Zod-validated environment config (server-only)
lib/                  Server query helpers, auth-client, formatters, csv export, resend wrapper, etc.
types/auth/           Zod schemas for login/signup forms
middleware.ts         Route protection for /dashboard/*
docs/                 Standalone documentation site (separate Next.js app)
```

The package is also exported piecemeal via `package.json#exports` (`/auth`, `/auth-client`, `/db`, `/db/schema`, `/config/env`, `/activity/*`, `/sessions/queries`, `/admin/queries`, `/users/queries`, `/settings/queries`, `/components/*`, `/lib/*`, `/styles/theme.css`) so a consuming project can cherry-pick pieces instead of copying the whole template.

---

## 3. Authentication (Better-Auth)

- **Providers:** Google OAuth, Email/Password (bcrypt-hashed, stored in `accounts` table with `providerId: "credential"`), Google One Tap (opt-in), passkeys / WebAuthn (passwordless, opt-in per user).
- **Two-factor (TOTP):** Better-Auth's `twoFactor` plugin — opt-in per user from the Settings page (QR-code setup + 10 encrypted single-use backup codes). A password sign-in on a 2FA-enabled account returns `twoFactorRedirect` instead of a session; `/login/2fa` takes the authenticator code or a backup code, with a 30-day "trust this device" option.
- **Passkeys (WebAuthn):** Better-Auth's `passkey` plugin — `rpID`/`origin` derived from `BETTER_AUTH_URL` (no extra env var). Register/remove credentials from Settings; "Sign in with a passkey" button on the login page. Passkey registration requires an existing authenticated session, so there is no passkey-based signup.
- **Passkey change alerts:** A successful `/passkey/verify-registration` or `/passkey/delete-passkey` fires an auth `after` hook that emails the account owner (device / location / IP / time, via a React Email template through Resend) and writes a `passkey_added` / `passkey_removed` activity-log entry. Best-effort — a mail failure never fails the endpoint; self-disables when `RESEND_API_KEY` is unset.
- **Extensible provider model:** `createAuth(overrides)` factory merges a project's own `socialProviders` (e.g. Apple) with the built-in Google provider without forking the template.
- **Session strategy:** Database-backed sessions, 30-day expiration, updated every 24h, with a 5-minute cookie cache for performance.
- **Runtime auth kill-switches:** Google, Email/Password, and One Tap can each be disabled live from the admin System Settings page (enforced server-side in a Better-Auth `hooks.before` middleware, not just hidden in the UI).
- **Custom user fields:** `role` (`user`/`admin`, defaults to `user`, not client-settable), `banned`, `bannedAt`, `bannedReason`, `banExpires`, `lastLoginAt`, `lastActiveAt`.
- **Admin plugin:** Better-Auth's `admin` plugin wired for impersonation (`impersonateUser` / `stopImpersonating`), with `adminRoles: ["admin"]` mapped to the app's own role column.
- **Impersonation auditing:** Impersonation start/stop is logged to the activity log via database hooks (start) and a `before` hook reading the session prior to Better-Auth deleting it (stop), since the admin plugin's impersonation-stop path bypasses normal session-create hooks.
- **Login activity capture:** Every real (non-impersonated) session creation logs an activity entry with IP, parsed user agent (OS/browser/device type via `ua-parser-js`), geo (country/city via `geoip-lite`), and referrer URL (captured via cookie before OAuth redirects, since the live referer header on an OAuth callback points at the provider, not the origin page).
- **First-login detection:** Session count for the user distinguishes "new account registered and signed in" from "user logged in."
- **Route protection:** `middleware.ts` guards `/dashboard/*`, checking for the Better-Auth session cookie (including `__Secure-` prefixed variant) and redirecting to `/login?callbackUrl=...`.
- **Password reset:** Better-Auth-composed reset URL, delivered via a React Email template through Resend.
- **Email verification:** Opt-in (`requireEmailVerification: false`). Users trigger it from the dashboard Account Details card via `authClient.sendVerificationEmail()`; Better-Auth composes the URL, mails it through Resend, and its `/api/auth/verify-email` callback flips `user.emailVerified` and auto-signs-in.
- **Server-side session access:** `auth.api.getSession({ headers })`.
- **Client-side:** `authClient` / `useSession` from `lib/auth-client.ts`; sign-in, sign-out, and social sign-in helpers.

---

## 4. Database Schema (Drizzle, PostgreSQL)

| Table | Purpose |
|---|---|
| `user` | Core user record — id (cuid2), name, email, password (nullable, credential-only), emailVerified, image, role, ban fields, lastLoginAt/lastActiveAt, timestamps |
| `session` | Database-backed sessions — token, expiry, IP, user agent, `impersonatedBy` (set while an admin is impersonating) |
| `account` | OAuth + credential accounts — provider tokens, credential password hash |
| `verification` | Email verification / password reset tokens |
| `twoFactor` | Per-user TOTP secret + encrypted backup codes (`twoFactor` plugin); `user.twoFactorEnabled` flips true after first verification |
| `passkey` | Registered WebAuthn credentials — public key, counter, device type, transports, AAGUID (`passkey` plugin) |
| `activity_log` | Append-only audit trail — action enum (login, logout, login_failed, password_changed, email_changed, profile_updated, session_revoked, user_deleted, user_banned, user_unbanned, role_changed, impersonation_started/stopped, settings_changed), description, IP, user agent, parsed device/geo fields, metadata |
| `system_settings` | Singleton row (`id = 'default'`, enforced via CHECK constraint) holding admin-editable runtime config: maintenance mode + message, auth method toggles (Google/email-password/One Tap), session-revocation toggle, `updatedBy` |
| `device_fingerprint` | One row per (user, FingerprintJS `visitorId`) — answers "has this account signed in from this device before?" for new-device alerts, and (many accounts on one `visitorId`) the multi-account / trial-abuse signal. First-seen IP/UA/geo kept for context |
| `auth_throttle` | Per-device fixed-window counter for `/sign-in/email` + `/sign-up/email` abuse, keyed by `visitorId` (not IP). Last IP/UA/email/kind kept so an admin can block the source |

Migrations are generated with `drizzle-kit generate` and applied per-environment (`migrate:dev` / `migrate:prod` / `migrate:test`). The published package does not ship migrations — consuming projects re-export the schema locally so `drizzle-kit` can resolve it directly.

---

## 5. Features

### Public site
- Landing page, features page (with copy-install button and scroll reveal), changelog page (+ changelog template), privacy policy, terms of service, maintenance page.
- Site header/footer, logo, theme toggle (light/dark via `next-themes`).
- Cookie-consent banner (`components/site/cookie-banner.tsx`, state in `lib/cookie-consent.ts`): "Necessary only" / "Accept all", stored in the `cookie_consent` cookie for 1 year and reopened from the footer's "Cookie settings". The FingerprintJS device id and Google One Tap only run after "Accept all"; without it the sign-in throttle uses its per-IP cap. Off with `NEXT_PUBLIC_COOKIE_BANNER=false`, which treats consent as granted.

### Auth pages
- Login, Signup, Forgot Password, Reset Password, 2FA challenge (`/login/2fa`) — all under `app/(auth)/`, built from shared `authCard` / `authShell` components.
- Google One Tap prompt (self-gating, opt-in).
- "Sign in with a passkey" button on the login page (WebAuthn, passwordless).
- OAuth callback double-hit recovery (`components/auth/loginErrorRecovery.tsx`) — silently retries a stale `please_restart_the_process` redirect instead of stranding the user.

### User dashboard (`/dashboard`)
- Profile card, account details card.
- Active sessions list with per-session revoke (device/IP/location shown via parsed user-agent + geoip).
- Personal activity log feed (with skeleton loading states and error boundaries per section).
- Client-side heartbeat to keep `lastActiveAt` fresh.
- Settings page — theme, plus a **Security** section: enable/disable TOTP two-factor (QR + backup codes, regenerate), and register/remove passkeys.

### Admin dashboard (`/dashboard/admin`)
- Stats grid (aggregate user/session counts, etc.).
- User management table — list, search, view detail, edit role, ban/unban (with reason), delete, bulk-ban, bulk-delete, CSV export.
- Per-user detail view — login info, sessions, activity log, status card, impersonation controls and impersonation-log card.
- Impersonation banner shown app-wide while an admin is impersonating a user.
- System-wide activity log viewer with CSV export.
- System Settings form — maintenance mode/message, live auth-method toggles (Google, Email/Password, One Tap), session-revocation toggle.
- Device security cards — **New devices** (first sign-in per account/device, with one-click session revoke), **Device throttle** (fingerprints hitting the sign-in/sign-up abuse limit), and **Shared devices** (one device fingerprint used by 3+ accounts — multi-account / trial-abuse signal, each account linked for a ban).
- Route- and section-level `error.tsx` / `loading.tsx` boundaries throughout the admin tree.

### Email
- Transactional templates via `@react-email/components`: welcome email, password reset, email verification, new-device alert, passkey-change alert, generic templates.
- Sending wrapper around Resend (`lib/resend.ts`), plus a demo send-email button component and `/api/send` route.

### API routes
- `POST/GET /api/auth/[...all]` — Better-Auth handler.
- `/api/activity-logs`, `/api/admin/activity-logs` (+ `/export`) — user and admin activity feeds.
- `/api/admin/settings` — system settings CRUD.
- `/api/admin/users`, `/[userId]`, `/[userId]/ban`, `/[userId]/role`, `/[userId]/sessions`, `/bulk-ban`, `/bulk-delete`, `/export` — full admin user management surface.
- `/api/sessions/revoke` — user self-service session revocation.
- `/api/settings/public` — public-safe subset of system settings (e.g. maintenance mode, enabled auth methods) for client consumption.
- `/api/heartbeat` — updates `lastActiveAt`.
- `/api/send` — transactional email sending.

### Environment-driven feature flags (`config/env.ts`, Zod-validated)
- `AUTH_ENABLE_GOOGLE`, `AUTH_ENABLE_EMAIL_PASSWORD`, `AUTH_ENABLE_ONE_TAP` (+ `NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP` for client-side gating).
- `ENABLE_SESSION_REVOCATION` — seed value only; live value lives in `system_settings` once seeded, editable from admin UI.
- `DB_DRIVER` (`pg` | `neon`) and `DATABASE_SSL` — dev typically uses local/Docker Postgres without SSL, production typically uses Neon.
- `RESEND_API_KEY` for transactional email.
- `NEXT_PUBLIC_COOKIE_BANNER` (default `true`): client-side switch for the cookie-consent banner.

### Distribution as a package
- Publishes reusable auth/db/UI/query-helper modules to the npm registry as `@xk2800/nextjs-template`.
- Selective `exports` map lets consumers import just what they need (`/auth`, `/auth-client`, `/db`, `/db/schema`, `/admin/queries`, `/sessions/queries`, `/users/queries`, `/activity/logger`, `/activity/queries`, `/settings/queries`, `/components/*`, `/lib/*`, `/styles/theme.css`).
- UI components ship as raw `.tsx` (not pre-compiled) so `'use client'` boundaries survive — consumers add the package to `transpilePackages`.
- Peer-dependency model keeps `next-themes`, `sonner`, and `@react-email/components`/`resend` optional, only required if those specific features are used.
- Documented extension points: adding a social provider without forking (`createAuth({ socialProviders })`), disabling built-in providers via env flags, enabling One Tap.

### Ops / deployment
- Dockerfile for containerized deploys (Postgres SSL config, npm-based build).
- Doppler integration as an opt-in alternative secrets source — every script has a `*:doppler` twin that injects secrets via `doppler run --` with no code changes required.
- `bun --env-file=... server/test-connection/index.ts` for verifying DB connectivity per environment.
- `bun run doctor` — checks runtime version, env validity, DB connectivity, and pending migrations in one command (`scripts/doctor.ts`, env schema split into `config/env-schema.ts` so it works outside Next's bundler).
- Standalone `docs/` Next.js site for template documentation.

---

## 6. Environments

Three supported environments, each with its own `.env.<env>` file and matching Drizzle/migration scripts: `development` (local/self-hosted Postgres), `production` (Neon), `test`. Doppler can replace `.env.*` files entirely for any environment.

---

## 7. Required Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `DB_DRIVER` | `pg` or `neon` |
| `DATABASE_SSL` | Whether to use SSL for the `pg` driver |
| `AUTH_SECRET` | Better-Auth cookie/token signing secret |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth credentials |
| `BETTER_AUTH_URL` | Base URL for auth callbacks |
| `NEXT_PUBLIC_APP_URL` | Client-side base URL |
| `AUTH_ENABLE_GOOGLE` / `AUTH_ENABLE_EMAIL_PASSWORD` / `AUTH_ENABLE_ONE_TAP` | Auth method toggles |
| `NEXT_PUBLIC_AUTH_ENABLE_ONE_TAP` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client-side One Tap config |
| `NEXT_PUBLIC_COOKIE_BANNER` | Cookie-consent banner on/off (default `true`) |
| `ENABLE_SESSION_REVOCATION` | Seed value for the session-revocation setting |
| `RESEND_API_KEY` | Transactional email |
| `PORT` | Server port (default 3000) |
| `NODE_ENV` | `development` \| `production` \| `test` |

---

## 8. Key Commands

```bash
bun install                # install deps
bun dev                    # dev server (Turbopack)
bun run lint                # ESLint
bun run typecheck           # tsc --noEmit

bun run generate            # generate Drizzle migrations
bun run migrate:dev|prod|test
bun run studio:dev|prod

bun run build                # build:lib (tsup) + next build
bun start                    # start production server

bun run dev:doppler / build:doppler / start:doppler / generate:doppler / migrate:doppler / studio:doppler
```

---

*Generated from a scan of the current repository state (commit `2b3e754`, branch `dev`).*
