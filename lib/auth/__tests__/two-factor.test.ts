import assert from "node:assert/strict"
import { betterAuth } from "better-auth"
import { memoryAdapter } from "better-auth/adapters/memory"
import { createOTP } from "@better-auth/utils/otp"
import { base32 } from "@better-auth/utils/base32"
import { twoFactorPlugins, type TwoFactorOptions } from "../two-factor"

// Runs the real Google OAuth callback against an in-memory DB; only Google's token
// endpoint is faked (its id_token is decoded, not verified, by better-auth).
const baseURL = "http://localhost:3000"
const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url")
const idToken = `${b64url({ alg: "none" })}.${b64url({ sub: "g-1", email: "ada@example.com", email_verified: true, name: "Ada" })}.sig`

const realFetch = globalThis.fetch
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  if (String(input instanceof Request ? input.url : input).startsWith("https://oauth2.googleapis.com/token")) {
    return Response.json({ access_token: "at", id_token: idToken, expires_in: 3600, token_type: "Bearer" })
  }
  return realFetch(input, init)
}) as typeof fetch

const splitPair = (c: string): [string, string] => [c.slice(0, c.indexOf("=")), c.slice(c.indexOf("=") + 1)]
function cookieHeader(res: Response, prev = "") {
  const jar = new Map(prev.split("; ").filter(Boolean).map(splitPair))
  for (const c of res.headers.getSetCookie()) {
    const [k, v] = splitPair(c.split(";")[0])
    if (v) jar.set(k, v)
    else jar.delete(k)
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ")
}

// A fresh auth instance + a user who signed in with Google and turned TOTP on.
async function setup(options: Omit<TwoFactorOptions, "issuer">) {
  const auth = betterAuth({
    baseURL,
    secret: "test-secret-test-secret-test-secret",
    database: memoryAdapter({ user: [], session: [], account: [], verification: [], twoFactor: [] }),
    socialProviders: { google: { clientId: "id", clientSecret: "secret" } },
    plugins: [...twoFactorPlugins(baseURL, { issuer: "Test", ...options })],
  })
  const req = (path: string, init: RequestInit & { cookie?: string } = {}) =>
    auth.handler(new Request(`${baseURL}/api/auth${path}`, {
      ...init,
      headers: { "content-type": "application/json", origin: baseURL, ...(init.cookie ? { cookie: init.cookie } : {}) },
    }))
  const post = (path: string, body: object, cookie: string) => req(path, { method: "POST", body: JSON.stringify(body), cookie })
  async function googleSignIn() {
    const start = await post("/sign-in/social", { provider: "google", callbackURL: "/dashboard/expenses" }, "")
    const state = new URL((await start.json()).url).searchParams.get("state")!
    const jar = cookieHeader(start)
    const cb = await req(`/callback/google?code=c&state=${state}`, { cookie: jar })
    return { cb, jar: cookieHeader(cb, jar) }
  }

  // No 2FA yet: straight to the callback URL with a session.
  const first = await googleSignIn()
  assert.equal(first.cb.headers.get("location"), "/dashboard/expenses")
  assert.match(first.jar, /better-auth\.session_token=/)

  // Turn TOTP on without a password (Google-only account).
  const enable = await post("/two-factor/enable", {}, first.jar)
  assert.equal(enable.status, 200)
  const secret = new URL((await enable.json()).totpURI).searchParams.get("secret")!
  const totp = () => createOTP(new TextDecoder().decode(base32.decode(secret))).totp()
  assert.equal((await post("/two-factor/verify-totp", { code: await totp() }, first.jar)).status, 200)

  return { req, post, googleSignIn, totp }
}

// Default (challengeAfterOAuth off): stock better-auth, Google sign-in isn't challenged.
{
  const { googleSignIn } = await setup({ passwordless: true })
  const again = await googleSignIn()
  assert.equal(again.cb.headers.get("location"), "/dashboard/expenses")
  assert.match(again.jar, /better-auth\.session_token=/)
}

// challengeAfterOAuth: Google sign-in is held at /login/2fa with no session until the code.
{
  const { req, post, googleSignIn, totp } = await setup({ passwordless: true, challengeAfterOAuth: true })
  const held = await googleSignIn()
  assert.equal(held.cb.headers.get("location"), "/login/2fa?callbackUrl=%2Fdashboard%2Fexpenses")
  assert.doesNotMatch(held.jar, /better-auth\.session_token=/)
  assert.match(held.jar, /better-auth\.two_factor=/)
  assert.equal(await (await req("/get-session", { cookie: held.jar })).json(), null)
  assert.equal((await post("/two-factor/verify-totp", { code: "000000" }, held.jar)).status, 401)
  const verified = await post("/two-factor/verify-totp", { code: await totp() }, held.jar)
  assert.equal(verified.status, 200)
  const signedIn = cookieHeader(verified, held.jar)
  assert.equal((await (await req("/get-session", { cookie: signedIn })).json()).user.email, "ada@example.com")

  // Passwordless: turning it off needs the current code, not just a signed-in session.
  assert.equal((await post("/two-factor/disable", {}, signedIn)).status, 401)
  assert.equal((await post("/two-factor/disable", { code: "000000" }, signedIn)).status, 401)
  assert.equal((await post("/two-factor/disable", { code: await totp() }, signedIn)).status, 200)
  assert.equal((await googleSignIn()).cb.headers.get("location"), "/dashboard/expenses")
}

globalThis.fetch = realFetch
console.log("two-factor: all assertions passed")
