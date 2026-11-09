# Manual Code Review Checklist

Feature-by-feature, in dependency order (foundations first). Each item: **files** → what to check.
⚠️ = something I noticed while mapping the codebase that deserves a close look.

---

## 0. Foundations

- [ ] **Env validation** — `config/env-schema.ts`, `config/env.ts`
  - [ ] Every var in SPEC §7 is in the schema; defaults are safe (flags default off where they should)
  - [ ] No server-only secret is read via a `NEXT_PUBLIC_*` name or imported into a client component
  - [ ] `.env.*.example` files match the schema
- [ ] **DB connection** — `server/db/index.ts`, `drizzle.config.ts`
  - [ ] `DB_DRIVER` (`pg` | `neon`) + `DATABASE_SSL` branches both work; no connection created per request
- [ ] **Schema & migrations** — `server/db/schema.ts`, `server/drizzle/0000…0014`
  - [ ] FKs have correct `onDelete` (user delete cascades sessions/accounts/logs as intended)
  - [ ] Indexes on hot lookups: session token, `auth_throttle.fingerprint`, `device_fingerprint (userId, visitorId)`, activity log `userId/createdAt`
  - [ ] Unique constraints back the logic (e.g. one `device_fingerprint` row per user+device)
  - [ ] Migrations match schema (`bun run generate` produces nothing)
- [ ] **Middleware** — `middleware.ts`
- [ ] **Proxy** (Next 16's rename of middleware) — `proxy.ts`
  - [ ] Only checks cookie *presence* — confirm every `/dashboard` page/layout still verifies the session server-side
  - [ ] `callbackUrl` redirect target is sanitized downstream (`normalizeCallbackUrl` in `lib/auth-helpers.ts`) — no open redirect via `//evil.com` or `/\evil.com`
- [ ] **Auth helpers** — `lib/auth-helpers.ts`
  - [ ] `requireAuth` / `requireRole` / `hasRole` — role compare can't be bypassed (null role, unknown role)
  - [ ] Banned users rejected by `requireAuth`

## 1. Authentication core — `server/auth.ts`

- [ ] Session config: 30-day expiry, 24h update age, 5-min cookie cache — revoked/banned sessions don't survive past the cache window unacceptably
- [ ] `role` field: `input: false` so users can't set it on signup/update (`better-auth.d.ts` matches)
- [ ] Password hashing: bcrypt 10 rounds, `hash`/`verify` wired correctly; compatible with `scripts/migrate-passwords.ts`
- [ ] `databaseHooks` (line ~222): side effects (welcome email, activity logs) can't fail the user creation
- [ ] `hooks.before` / `hooks.after` (line ~311): paths matched exactly (no prefix bypass like `/sign-in/email-otp`)
- [ ] Plugins (line ~459): `admin`, `twoFactor`, `passkey`, `oneTap` — config values (rpID, origin, issuer) come from env, not hardcoded localhost
- [ ] `trustedOrigins` / `BETTER_AUTH_URL` correct for prod
- [ ] Env auth-method flags (`AUTH_ENABLE_*`) **and** live `system_settings` toggles both enforced server-side, not just hidden in UI
- [ ] `createAuth({ socialProviders })` extension point works without forking

## 2. Auth pages & flows — `app/(auth)/*`, `components/auth/*`

- [ ] **Login** — `login/page.tsx`, `emailPasswordLogin.tsx`, `types/auth/loginSchema.ts`
  - [ ] Redirects if already signed in; error messages don't leak whether an email exists
- [ ] **Signup** — `signup/page.tsx`, `emailPasswordSignup.tsx`, `signupSchema.ts`
  - [ ] Server-side validation matches client Zod schema (min password length etc.)
  - [ ] Respects "email/password disabled" setting server-side
- [ ] **Forgot / Reset password** — `forgotPasswordForm.tsx`, `resetPasswordForm.tsx`, reset email template
  - [ ] Always returns same response for unknown email; token single-use & expires; other sessions revoked after reset
- [ ] **2FA challenge** — `login/2fa/page.tsx`, `twoFactorVerifyForm.tsx`
  - [ ] Can't reach dashboard with a half-authenticated session; backup codes single-use; attempt limiting
- [ ] **Google OAuth** — `socialLogin.tsx`; account linking to existing email only when email verified
- [ ] **One Tap** — `oneTap.tsx`; gated by env flag + live setting + cookie consent
- [ ] **Passkey login** — `passkeyLogin.tsx`; handles cancel / no-credential gracefully
- [ ] **OAuth error recovery** — `loginErrorRecovery.tsx`; retry can't loop forever
- [ ] **Logout** — `logoutButtons.tsx`; clears client state, redirects
- [ ] Shared shells — `authCard.tsx`, `authShell.tsx`

## 3. Abuse protection & device tracking

- [ ] **Per-device throttle** — `lib/auth-throttle.ts`, `lib/auth-throttle-limits.ts` (+ `.test.ts`), `auth_throttle` table
  - [ ] Header `x-device-fingerprint` is client-controlled → rotating it resets the budget; confirm the per-IP cap backs it up
  - [ ] Fallback when fingerprint missing (no consent) uses IP cap — verify IP source (`lib/request-info.ts`) can't be spoofed via `x-forwarded-for` behind your proxy
  - [ ] Tumbling-window race (`ponytail:` comment) acceptable
  - [ ] Nonexistent email still counts (no enumeration via timing/status)
  - [ ] Run: `bun run test`, `bun scripts/loadtest-throttle.ts 30 1`
- [ ] **New-device alert** — `app/api/device-check/route.ts`, `components/auth/deviceCheck.tsx`, `lib/device-fingerprint.ts`, `email-template-new-device.tsx`
  - [ ] Route requires a session; can't be spammed to email-bomb user/admins
  - [ ] Email to *every admin* scales OK; email failure doesn't break sign-in
  - [ ] Run: `bun scripts/test-new-device.ts`
- [ ] **Shared devices** — `lib/shared-devices.ts` (+ `.test.ts`); 3+ accounts threshold correct
- [ ] **Request info** — `lib/request-info.ts`; UA parsing + geoip don't throw on odd input

## 4. User dashboard — `app/dashboard/*`, `components/dashboard/*`

- [ ] `dashboard/layout.tsx` — server-side session check; maintenance-mode gate
  - ⚠️ Maintenance mode appears to be enforced only here — confirm that's intended (public pages, auth pages, and `/api/*` stay open; admins bypass?)
- [ ] **Maintenance mode** — `proxy.ts`, `lib/maintenance.ts` (+ test); site-wide except admin-configured exempt paths + always-open auth paths; admins/impersonators bypass; `/api/*` gets 503
- [ ] Profile / account details — `profileCard.tsx`, `accountDetailsCard.tsx`, `verifyEmailButton.tsx`
- [ ] **Sessions** — `sessionsSection.tsx`, `sessionsCard.tsx`, `app/api/sessions/revoke/route.ts`, `lib/session-queries.ts`
  - [ ] Revoke checks the session belongs to the caller (no IDOR); respects `ENABLE_SESSION_REVOCATION` setting server-side
  - [ ] Revoking current session handled
- [ ] **Activity log** — `activityLogsSection.tsx`, `activityLogsCard.tsx`, `app/api/activity-logs/route.ts`, `lib/activity-logger.ts`, `lib/activity-queries.ts`
  - [ ] Scoped to `session.user.id`; pagination bounds (`lib/page-range.test.ts`); logger never throws into caller
- [ ] **Heartbeat** — `heartbeat.tsx`, `app/api/heartbeat/route.ts`; interval sane, pauses on hidden tab, auth'd
- [ ] **Settings / security** — `dashboard/settings/page.tsx`, `twoFactorCard.tsx`, `passkeysCard.tsx`, `email-template-passkey-change.tsx`
  - [ ] Enabling/disabling 2FA requires password; backup codes shown once
  - [ ] Passkey add/remove sends alert email
- [ ] Data-table demo — `dashboard/data-table/page.tsx`, `lib/recalculate-columns.ts` (+ test)
- [ ] Error/loading boundaries — `error.tsx`, `loading.tsx`, `sectionErrorFallback.tsx`, `components/error-boundary.tsx`; errors don't leak stack/details to UI

## 5. Admin dashboard — `app/dashboard/admin/*`, `app/api/admin/*`

- [ ] **Every** admin route & page calls `requireRole('admin')` (or equivalent) server-side — check each:
  - [ ] `api/admin/users/route.ts` (list/search — SQL built safely, `ilike` input escaped, limit capped)
  - [ ] `api/admin/users/[userId]/route.ts` (detail, delete — can't delete self / last admin)
  - [ ] `api/admin/users/[userId]/role/route.ts` (can't demote self / last admin; role value validated)
  - [ ] `api/admin/users/[userId]/ban/route.ts` (reason length; ban revokes sessions; can't ban self/admins?)
  - [ ] `api/admin/users/[userId]/sessions/route.ts`
  - [ ] `api/admin/users/bulk-ban/route.ts`, `bulk-delete/route.ts` (array size capped; self excluded)
  - [ ] `api/admin/users/export/route.ts`, `api/admin/activity-logs/export/route.ts` — `lib/csv.ts` escapes and guards CSV formula injection (`=`, `+`, `-`, `@`)
  - [ ] `api/admin/activity-logs/route.ts`
  - [ ] `api/admin/settings/route.ts` — body validated with Zod
- [ ] Admin queries — `lib/admin-queries.ts`, `lib/user-queries.ts`, `lib/settings-queries.ts`; N+1s on stats grid / user table
- [ ] Every admin action writes an activity log entry
- [ ] **Stats grid** — `adminStatsGrid.tsx`
- [ ] **Users table / detail** — `adminUsersTable.tsx`, `usersSection.tsx`, `users/[userId]/page.tsx`, `adminUserLoginInfoCard.tsx`, `adminUserSessionsCard.tsx`, `adminUserStatusCard.tsx`, `adminUserActivityLogCard.tsx`, `revokeAllSessionsButton.tsx`
- [ ] **Impersonation** — `impersonationBanner.tsx`, `impersonationLogCard.tsx`
  - [ ] Can't impersonate another admin; start/stop both logged; impersonated session expires; banner always visible
- [ ] **System settings** — `systemSettingsForm.tsx`, `systemSettingsSection.tsx`; toggles take effect live (no restart); disabling all login methods doesn't lock admins out
- [ ] **Device cards** — `newDeviceCard/Table.tsx`, `deviceThrottleCard/Table.tsx`, `sharedDeviceCard/Table.tsx`; one-click revoke/ban hits guarded routes
- [ ] **Activity logs page** — `admin/activity-logs/*`, `adminActivityLogsTable.tsx`

## 6. Public site — `app/*`, `components/site/*`

- [ ] Landing — `app/page.tsx`, `page-data.json`
- [ ] Features — `app/features/page.tsx`, `features-data.json`, `CopyInstallButton.tsx`, `RevealOnScroll.tsx` (content matches reality)
- [ ] Changelog — `app/changelog/page.tsx`, `changelog-template/page.tsx`, `changelog-view.tsx`, `data/changelog*.json`
- [ ] Update modal — `components/Updates/UpdateModal.tsx`, `modal-provider.tsx`
- [ ] Privacy / Terms / Maintenance pages — privacy text reflects fingerprinting + cookies actually used
- [ ] Header / footer / logo / theme toggle — `site-header.tsx`, `site-footer.tsx`, `theme-toggle.tsx`, `theme-provider.tsx`; no hydration mismatch
- [ ] **Cookie consent** — `cookie-banner.tsx`, `lib/cookie-consent.ts`, `lib/cookie-names.ts`
  - [ ] FingerprintJS + One Tap never load before "Accept all"; withdrawing consent stops them
  - [ ] `NEXT_PUBLIC_COOKIE_BANNER=false` path treats consent as granted
  - [ ] "Cookie settings" in footer reopens banner

## 7. Email — `lib/resend.ts`, `components/email/*`, `app/api/send/*`

- [ ] Templates render; user-supplied values (names) escaped; links use `BETTER_AUTH_URL`, not request host
- [ ] Missing `RESEND_API_KEY` degrades gracefully
- [ ] `/api/send/route.ts` — auth'd, rate-limited, can't send to arbitrary recipients
- [ ] ⚠️ `app/api/send.ts` — Pages-Router-style handler (`NextApiRequest`) sitting in `app/`; not a route. Likely dead code → delete?
- [ ] `send-email-button.tsx`, `email-template.tsx`, `email-template-2.tsx` — demo only, fine to ship?

## 8. Public API — `app/api/settings/public/route.ts`, `app/api/auth/[...all]/route.ts`

- [ ] Public settings exposes only non-sensitive fields
- [ ] Auth catch-all exports only what Better-Auth needs

## 9. Package distribution — `package.json`, `tsup.config.ts`, `tsconfig.build.json`, `PUBLISHING.md`

- [ ] `exports` map entries all resolve in `dist/`; no server module (`/auth`, `/db`) pulled into a client-marked export
- [ ] `.tsx` components keep `'use client'`; peer deps marked optional correctly
- [ ] `files` field doesn't ship `.env*`, `brag-output/`, `docs/`

## 10. Ops

- [ ] `Dockerfile` — multi-stage, non-root user, no secrets baked in; ⚠️ `Dockerfile-old` still present — delete?
- [ ] `scripts/doctor.ts`, `scripts/bump-version.ts`, `scripts/test-2fa.ts`, `server/test-connection/index.ts`
- [ ] `scripts/bump-version.ts` beta release type (+ `bump-version.test.ts`) — prerelease version, `npm publish --tag beta`, GitHub `--prerelease`; promoting beta → stable drops the suffix
- [ ] Doppler scripts in `package.json` mirror the non-Doppler ones
- [ ] `.dockerignore` / `.gitignore` exclude env files, `brag-output/` media
- [ ] `.github/dependabot.yml`
- [ ] `docs/` site builds; content matches current features

## 11. Cross-cutting sweep

- [ ] `bun run lint`, `bun run test`, `bun run build` clean
- [ ] `grep -rn "console.log"` / `TODO` / `any` in `app lib server components`
- [ ] All API routes validate input with Zod and return consistent error shapes
- [ ] Docs in sync: `app/features/page.tsx`, `SPEC.md §5`, `README.md`, `data/changelog.json`, `features-test.md`
