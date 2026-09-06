# Feature test notes

How to exercise features that aren't covered by `bun run test` alone.

---

## Per-device abuse throttle (sign-in / sign-up)

Throttles credential attempts by FingerprintJS `visitorId` (sent as the
`x-device-fingerprint` header), not by IP. Policy lives in
`lib/auth-throttle-limits.ts` (`MAX = 10` attempts / `WINDOW_MS = 15min`),
storage in `auth_throttle`, wiring in `server/auth.ts` (`hooks.before` /
`hooks.after`).

### 1. Unit test (window / limit decision)

```bash
bun lib/auth-throttle-limits.test.ts   # or: bun run test
```

### 2. Load test (end-to-end, hits the real endpoint)

Needs the dev server running (`bun dev`) — better-auth's own IP rate-limiter
is off in dev and on in a production build, which would muddy the result.

```bash
bun scripts/loadtest-throttle.ts 30 1        # sequential
bun scripts/loadtest-throttle.ts 100 25      # concurrent burst
bun scripts/loadtest-throttle.ts 30 1 my-fp  # reuse a fixed fingerprint
```

Args: `[total=30] [concurrency=1] [fingerprint]`. Target defaults to
`http://localhost:3000` (override with `LOADTEST_URL`).

**Expected:**

- Sequential run → exactly **10× `401`** then **`429`** for the rest.
- `401`s are slow (~50–100ms — bcrypt runs); `429`s are fast (one indexed
  `SELECT`, no bcrypt). Latency drops off a cliff after attempt #10.
- A concurrent burst leaks a few extra `401`s past 10 — the tumbling-window
  race noted in the `ponytail:` comment in `lib/auth-throttle.ts`. A large
  leak means switch to a sliding window.
- A different fingerprint gets its own fresh budget of 10.
- No real user needed — a nonexistent email still counts as a failed attempt.

### 3. Admin dashboard view

After a load run, open `/dashboard/admin` (as an admin) → **Device throttle**
card shows a `loadtest-*` row with the attempt count, a **Blocked** badge
(window is 15 min), and the last IP / user agent / target email. Also shown
on `/dashboard/admin/activity-logs`.

### 4. Cleanup

The script uses a fresh fingerprint per run unless you pass one, so this is
only needed after using a fixed fingerprint:

```sql
DELETE FROM auth_throttle WHERE fingerprint LIKE 'loadtest-%';
```

---

## New-device sign-in alert

First time an account is seen on a given FingerprintJS `visitorId`, the user
**and every admin** get an email and the sign-in shows on the admin panel's
**New devices** card. Detection is fingerprint-only (not IP/UA). Route:
`app/api/device-check/route.ts`, client trigger:
`components/auth/deviceCheck.tsx`, storage: `device_fingerprint`.

### 1. End-to-end test (hits the real endpoint)

Needs the dev server running (`bun dev`) and a real account to sign in as.

```bash
TEST_EMAIL=you@example.com TEST_PASSWORD=secret bun scripts/test-new-device.ts
```

Target defaults to `http://localhost:3000` (override with `DEVICE_CHECK_URL`).

**Expected:** four `PASS` lines —

- no session → `401`
- body with no `visitorId` → `400`
- a fresh `visitorId` → `{ newDevice: true }` (row written; emails sent if the
  server has `RESEND_API_KEY`)
- the same `visitorId` again → `{ newDevice: false }` (dedup — no second email)

Emails aren't asserted (no Resend mock) — check the dev server logs or the
Resend dashboard. Without `RESEND_API_KEY` on the server the route still
records the row and returns the JSON above, so the checks still pass.

### 2. Admin dashboard view + session revoke

After a run, open `/dashboard/admin` (as an admin) → **New devices** card
shows the account, device, location, IP and time. Each row:

- links to the user's admin detail page, and
- has a one-click **Revoke sessions** (confirm dialog → `DELETE
  /api/admin/users/[id]/sessions`, writes a `session_revoked` audit entry).

The same **Revoke all sessions** button is on the user detail page's
**Sessions** card. Cached sessions can linger up to 5 min
(`session.cookieCache.maxAge` in `server/auth.ts`).

### 3. Cleanup

```sql
DELETE FROM device_fingerprint WHERE "visitorId" LIKE 'testdev-%';
```

---

## Multi-account / trial-abuse detection

The admin panel's **Shared devices** card flags any FingerprintJS `visitorId`
in `device_fingerprint` that 3+ distinct accounts have signed in from
(threshold: `MIN_SHARED_ACCOUNTS` in `lib/admin-queries.ts`). Grouping / sort /
threshold logic is pure and lives in `lib/shared-devices.ts`.

### 1. Unit test (grouping / sort / limit / threshold)

```bash
bun lib/shared-devices.test.ts   # or: bun run test
```

### 2. Admin dashboard view

Seed 3+ accounts on one fingerprint (use real user ids), then open
`/dashboard/admin` (as an admin) → **Shared devices** card lists the device, its
account count, and every account (each links to its admin page for a ban). Two
accounts on one device is below threshold and won't show.

```sql
INSERT INTO device_fingerprint ("userId", "visitorId") VALUES
  ('<uid1>', 'sharedtest-1'),
  ('<uid2>', 'sharedtest-1'),
  ('<uid3>', 'sharedtest-1');
```

### 3. Cleanup

```sql
DELETE FROM device_fingerprint WHERE "visitorId" LIKE 'sharedtest-%';
```

---

## Two-factor auth (TOTP) & passkeys

Better-Auth's `twoFactor` + `passkey` plugins, wired in `server/auth.ts` /
`lib/auth-client.ts`. UI: `components/dashboard/twoFactorCard.tsx`,
`components/dashboard/passkeysCard.tsx` (dashboard **Settings** → Security),
`components/auth/twoFactorVerifyForm.tsx` (`/login/2fa`),
`components/auth/passkeyLogin.tsx` (login page). Tables: `twoFactor`,
`passkey`, `user.twoFactorEnabled` (migration `0013`).

Not covered by `bun run test` — WebAuthn needs a real authenticator, TOTP
needs an authenticator app or a code generator.

### 1. TOTP — end-to-end via the API (no app needed)

Needs the dev server running. Origin checks require the request `Origin` to
match `BETTER_AUTH_URL`, so run the server on the port that env var points at
(default `3000`).

```bash
bun scripts/test-2fa.ts   # signs up a throwaway user, enables 2FA,
                          # verifies setup, re-logs-in through the challenge,
                          # tests a backup code, then disables
```

**Expected:** `enable` returns a `totpURI` + 10 backup codes; setup
`verify-totp` → `200` and `user.twoFactorEnabled` becomes true in the DB
(the cookie-cache means `get-session` can lag up to 5 min — check the row);
a second `sign-in/email` returns `twoFactorRedirect: true` with **no**
session token; `verify-totp` / `verify-backup-code` then complete the
session; `disable` clears the flag and deletes the `twoFactor` row.

### 2. TOTP — in the browser

`/dashboard/settings` → Security → **Enable 2FA** → enter password → scan the
QR with any authenticator app → enter the 6-digit code → save the backup
codes. Sign out, sign in with email/password → you land on `/login/2fa` →
code (or "use a backup code instead") → dashboard. Tick "trust this device
for 30 days" and the next password sign-in skips the challenge on that
browser. Back in Settings: **Regenerate backup codes** and **Disable 2FA**
both re-prompt for the password.

Known limitation: enabling/disabling 2FA and viewing backup codes require the
account password — a Google-only account with no password set can't use 2FA.

### 3. Passkeys — in the browser (needs a platform authenticator)

`/dashboard/settings` → Security → Passkeys → optional name → **Add a
passkey** → complete the OS prompt (Touch ID / Windows Hello / security key,
or a virtual authenticator in Chrome DevTools → *WebAuthn*). The credential
appears in the list. Sign out → login page → **Sign in with a passkey** →
pick the credential → dashboard. Back in Settings, **Remove** deletes it.

API smoke check (server on `BETTER_AUTH_URL`'s port):

```bash
# authed GET, returns [] before any passkey is registered
curl -s -H "cookie: <session>" http://localhost:3000/api/auth/passkey/list-user-passkeys
# authed GET, rp.id === BETTER_AUTH_URL host, rp.name === "Next.js Template"
curl -s -H "cookie: <session>" -H "origin: http://localhost:3000" \
  http://localhost:3000/api/auth/passkey/generate-register-options
```

### 4. Cleanup

```sql
DELETE FROM "user" WHERE email LIKE '2fa-test-%';   -- cascades to twoFactor / passkey
```

---

## Email verification

Better-Auth's core `emailVerification` config in `server/auth.ts` (Resend +
`components/email/email-template-verify-email.tsx`). Opt-in:
`requireEmailVerification: false`. UI: **Verify email** button on the
dashboard **Account Details** card
(`components/dashboard/verifyEmailButton.tsx`), shown only while
`user.emailVerified` is false. No new table — reuses `verification`.

Not covered by `bun run test` — needs a real inbox (Resend) to click the link.

### 1. In the browser

1. Sign up / sign in with an unverified account → dashboard shows the
   `Unverified` badge and a **Verify email** button.
2. Click it → toast "Verification email sent", button disables.
3. Open the email, click **Verify email** → lands on `/dashboard`,
   auto-signed-in, badge now `Verified`.

### 2. Via the API (no app needed)

```bash
# authed POST; 200 and an email is dispatched via Resend
curl -s -X POST -H "cookie: <session>" -H "content-type: application/json" \
  -d '{"email":"<user-email>","callbackURL":"/dashboard"}' \
  http://localhost:3000/api/auth/send-verification-email
# the link resolves to /api/auth/verify-email?token=...; hitting it flips
# user.emailVerified true and redirects to callbackURL
```

### 3. Cleanup

```sql
DELETE FROM "verification" WHERE identifier LIKE 'email-verification%';
```

---

## Passkey add/remove alerts

An auth `after` hook in `server/auth.ts` (`notifyPasskeyChange`) fires on a
successful `/passkey/verify-registration` or `/passkey/delete-passkey`: it
emails the account owner via `components/email/email-template-passkey-change.tsx`
(Resend) and writes a `passkey_added` / `passkey_removed` row to the activity
log. Best-effort — never fails the endpoint; self-disables without
`RESEND_API_KEY`. Needs migration `0014` (new `activity_actions` enum values).

Not covered by `bun run test` — passkey registration needs a real
authenticator.

### 1. In the browser

1. Dashboard **Settings → Security → Passkeys**, register a passkey with a
   platform authenticator.
2. Inbox gets **"A passkey was added to your account"**; dashboard activity
   log shows `Passkey added`.
3. Remove the passkey from the same card → **"A passkey was removed…"** email
   + `Passkey removed` activity row.

### 2. Verify without email configured

Unset `RESEND_API_KEY`, repeat step 1 — no send attempt, but the activity-log
row is still written and the endpoint succeeds.

### 3. Cleanup

```sql
DELETE FROM "activity_log" WHERE action IN ('passkey_added','passkey_removed');
```
