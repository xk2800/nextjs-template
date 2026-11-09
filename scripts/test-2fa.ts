// End-to-end check for TOTP two-factor auth (better-auth `twoFactor` plugin,
// wired in server/auth.ts). Usage: bun scripts/test-2fa.ts
//
// Needs `bun dev` running. Better-Auth's origin check requires the request
// `Origin` to match BETTER_AUTH_URL, so point TWO_FA_URL (default
// http://localhost:3000) at whatever port that env var uses.
//
// Signs up a throwaway user, then asserts the full lifecycle:
//   - enable            -> 200, returns totpURI + 10 backup codes
//   - verify-totp (setup) -> 200
//   - re-sign-in        -> { twoFactorRedirect: true }, no session token
//   - verify-totp (login) -> 200, session now resolves to the user
//   - verify-backup-code (fresh login) -> 200
//   - disable           -> 200
//
// Cleanup:  DELETE FROM "user" WHERE email LIKE '2fa-test-%';

import { createOTP } from "@better-auth/utils/otp"
import { base32 } from "@better-auth/utils/base32"

export {} // make this a module so top-level await type-checks

const BASE = process.env.TWO_FA_URL ?? "http://localhost:3000"
const email = `2fa-test-${Date.now()}@example.com`
const password = "Test1234!pass"

let failures = 0
function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`)
  if (!ok) failures++
}

// Mirror a browser's cookie jar: replace by name, and honour deletions
// (Max-Age=0 / Expires in the past). better-auth's 2FA sign-in response sets
// then immediately clears the session cookies in one response, leaving only
// the pending `two_factor` cookie — a naive append-only jar would keep the
// stale session_data blob and look logged in.
const jar = new Map<string, string>()
function stash(res: Response) {
  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [pair, ...attrs] = raw.split(";")
    const eq = pair.indexOf("=")
    const name = pair.slice(0, eq).trim()
    const value = pair.slice(eq + 1).trim()
    const cleared = attrs.some((a) => {
      const [k, v] = a.split("=").map((s) => s.trim().toLowerCase())
      return (k === "max-age" && Number(v) <= 0) || (k === "expires" && new Date(v).getTime() <= Date.now())
    })
    if (cleared || value === "") jar.delete(name)
    else jar.set(name, value)
  }
}
const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ")
const json = (r: Response) => r.text().then((t) => { try { return JSON.parse(t) } catch { return t } })

function post(path: string, body: unknown) {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE, cookie: cookie() },
    body: JSON.stringify(body),
  })
}
const getSession = () =>
  fetch(`${BASE}/api/auth/get-session`, { headers: { cookie: cookie() } }).then(json)

// 1. sign up
{
  const res = await post("/api/auth/sign-up/email", { email, password, name: "2FA Test" })
  stash(res)
  check("sign-up", res.status === 200, `got ${res.status}`)
}

// 2. enable — returns the provisioning URI + backup codes (not yet active)
let totpUri = ""
let backupCodes: string[] = []
{
  const res = await post("/api/auth/two-factor/enable", { password })
  stash(res)
  const data = await json(res)
  totpUri = data?.totpURI ?? ""
  backupCodes = data?.backupCodes ?? []
  check(
    "enable returns totpURI + 10 backup codes",
    res.status === 200 && totpUri.startsWith("otpauth://") && backupCodes.length === 10,
    `status ${res.status}, ${backupCodes.length} codes`,
  )
}

// Derive the raw TOTP secret the way an authenticator app does: base32-decode
// the URI's `secret` param. better-auth verifies with createOTP(rawSecret).
const rawSecret = new TextDecoder().decode(
  base32.decode(new URL(totpUri).searchParams.get("secret") ?? ""),
)
const totp = () => createOTP(rawSecret, { digits: 6, period: 30 }).totp()

// 3. verify the setup code -> 2FA becomes active
{
  const res = await post("/api/auth/two-factor/verify-totp", { code: await totp() })
  stash(res)
  check("verify-totp (setup)", res.status === 200, `got ${res.status}`)
}

// 4. re-login -> challenge, no session yet
{
  await post("/api/auth/sign-out", {})
  jar.clear()
  const res = await post("/api/auth/sign-in/email", { email, password })
  stash(res)
  const data = await json(res)
  check(
    "password sign-in on a 2FA account returns twoFactorRedirect and no token",
    data?.twoFactorRedirect === true && !data?.token,
    JSON.stringify(data),
  )
  const sess = await getSession()
  check("no user session before the 2FA code is verified", !sess?.user, sess?.user?.email ?? "null")
}

// 5. complete the challenge with a TOTP code
{
  const res = await post("/api/auth/two-factor/verify-totp", { code: await totp(), trustDevice: true })
  stash(res)
  const sess = await getSession()
  check(
    "verify-totp (login) completes the session",
    res.status === 200 && sess?.user?.email === email,
    `status ${res.status}, session ${sess?.user?.email ?? "null"}`,
  )
}

// 6. a backup code also completes a fresh challenge
{
  await post("/api/auth/sign-out", {})
  jar.clear()
  await post("/api/auth/sign-in/email", { email, password }).then(stash)
  const res = await post("/api/auth/two-factor/verify-backup-code", { code: backupCodes[0] })
  stash(res)
  const sess = await getSession()
  check(
    "verify-backup-code completes the session",
    res.status === 200 && sess?.user?.email === email,
    `status ${res.status}, session ${sess?.user?.email ?? "null"}`,
  )
}

// 7. disable
{
  const res = await post("/api/auth/two-factor/disable", { password })
  stash(res)
  check("disable", res.status === 200, `got ${res.status}`)
}

console.log(failures === 0 ? "\nAll 2FA checks passed." : `\n${failures} check(s) FAILED.`)
process.exit(failures === 0 ? 0 : 1)
