// Pure throttle policy — no DB, no `server-only`, so it stays unit-testable.
// Consumed by lib/auth-throttle.ts (the DB plumbing) and its test.

// Tune per deployment, or lift to env vars if you need it configurable.
export const WINDOW_MS = 15 * 60 * 1000 // how long attempts accumulate
export const MAX = 10 // failed sign-ins / sign-ups per window before a 429, per fingerprint

// Backstop cap keyed by IP instead of fingerprint — the fingerprint header is
// client-supplied and unsigned, so it's trivial to omit or randomize per
// request (see server/auth.ts before-hook). Higher than MAX because an IP can
// be shared behind NAT/CGNAT/VPN.
// ponytail: flat multiplier, not a real per-deployment tuning — revisit if
// legitimate shared-IP traffic ever gets caught in it.
export const MAX_IP = MAX * 3

// A row whose window has already elapsed counts as "no row" — it resets on
// the next attempt (see recordDeviceAttempt), so the device isn't blocked in
// the meantime.
export function isOverLimit(
  row: { count: number; windowStart: Date } | undefined,
  now: number,
  max: number = MAX,
): boolean {
  if (!row) return false
  if (now - row.windowStart.getTime() >= WINDOW_MS) return false
  return row.count >= max
}
