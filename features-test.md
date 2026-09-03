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
