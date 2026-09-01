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
