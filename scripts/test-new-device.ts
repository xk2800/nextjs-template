// End-to-end check for the new-device sign-in alert (app/api/device-check).
// Usage: bun scripts/test-new-device.ts
//   TEST_EMAIL=you@example.com TEST_PASSWORD=secret bun scripts/test-new-device.ts
//
// Needs `bun dev` running. Signs in as TEST_EMAIL, then POSTs /api/device-check
// the way components/auth/deviceCheck.tsx does on page load, asserting:
//   - no session           -> 401
//   - body with no visitorId -> 400
//   - a fresh visitorId    -> { newDevice: true }   (records the row, fires emails)
//   - the same visitorId    -> { newDevice: false }  (dedup — no second email)
//
// Target defaults to http://localhost:3000 (override with DEVICE_CHECK_URL).
// If the dev server has RESEND_API_KEY set, real emails go to TEST_EMAIL and
// every admin; if not, the route still records the row and returns the JSON
// above, so the assertions pass either way.
//
// Cleanup:  DELETE FROM device_fingerprint WHERE "visitorId" LIKE 'testdev-%';

export {} // make this a module so top-level await type-checks

const BASE = process.env.DEVICE_CHECK_URL ?? "http://localhost:3000"
const email = process.env.TEST_EMAIL ?? "test@example.com"
const password = process.env.TEST_PASSWORD ?? "password12345"

let failures = 0
function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`)
  if (!ok) failures++
}

// 1. Unauthenticated -> 401
{
  const res = await fetch(`${BASE}/api/device-check`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ visitorId: "testdev-noauth" }),
  })
  await res.text()
  check("rejects request with no session", res.status === 401, `got ${res.status}`)
}

// 2. Sign in, capture the session cookie(s)
const signIn = await fetch(`${BASE}/api/auth/sign-in/email`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
})
const signInBody = await signIn.text()
if (!signIn.ok) {
  console.error(`\nSign-in failed (${signIn.status}): ${signInBody}`)
  console.error("Set TEST_EMAIL / TEST_PASSWORD to a real account, or seed one first.")
  process.exit(1)
}
const cookie = signIn.headers
  .getSetCookie()
  .map((c) => c.split(";")[0])
  .join("; ")
check("signed in and got a session cookie", cookie.includes("session"), cookie || "(none)")

const post = (visitorId: unknown) =>
  fetch(`${BASE}/api/device-check`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ visitorId }),
  })

// 3. Missing visitorId -> 400
{
  const res = await post(undefined)
  await res.text()
  check("rejects body with no visitorId", res.status === 400, `got ${res.status}`)
}

// 4. Fresh visitorId -> newDevice: true
const vid = `testdev-${Date.now()}`
{
  const res = await post(vid)
  const json = (await res.json().catch(() => ({}))) as { newDevice?: boolean }
  check("first sight of a device -> newDevice: true", res.ok && json.newDevice === true, JSON.stringify(json))
}

// 5. Same visitorId again -> newDevice: false (dedup)
{
  const res = await post(vid)
  const json = (await res.json().catch(() => ({}))) as { newDevice?: boolean }
  check("same device again -> newDevice: false", res.ok && json.newDevice === false, JSON.stringify(json))
}

console.log(
  `\n${failures ? `${failures} check(s) failed` : "all checks passed"}\n` +
    `\nrows     : SELECT * FROM device_fingerprint WHERE "visitorId" LIKE 'testdev-%';` +
    `\npanel    : open /dashboard/admin (as an admin) -> "New devices" card shows the row,` +
    `\n           each row has a one-click "Revoke sessions"` +
    `\nemails   : check the dev server logs / Resend dashboard (needs RESEND_API_KEY on the server)` +
    `\ncleanup  : DELETE FROM device_fingerprint WHERE "visitorId" LIKE 'testdev-%';`,
)
process.exit(failures ? 1 : 0)
