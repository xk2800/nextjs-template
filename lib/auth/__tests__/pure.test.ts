import assert from "node:assert/strict"

import { getBaseUrl } from "../base-url"
import { hasRole, normalizeCallbackUrl, wouldRemoveAllAdmins } from "../pure"

// Open-redirect guard: anything leaving this origin falls back to /dashboard.
for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "", "   ", undefined, ["/a"]]) {
  assert.equal(normalizeCallbackUrl(bad as string | undefined), "/dashboard", String(bad))
}
assert.equal(normalizeCallbackUrl("/ok?x=1"), "/ok?x=1")
assert.equal(normalizeCallbackUrl("/ok?x=1#h"), "/ok?x=1#h")

assert.equal(hasRole("admin", "admin"), true)
assert.equal(hasRole("user", "admin"), false)
assert.equal(hasRole("tester", "admin"), false)
assert.equal(hasRole(null, "user"), false)
assert.equal(hasRole("tester", "user"), true)

// Last-admin rule: never remove every admin.
assert.equal(wouldRemoveAllAdmins(1, 1), true)
assert.equal(wouldRemoveAllAdmins(2, 2), true)
assert.equal(wouldRemoveAllAdmins(1, 2), false)
assert.equal(wouldRemoveAllAdmins(0, 1), false)

// Base URL: one precedence rule, trailing slash stripped, localhost fallback.
for (const k of ["BETTER_AUTH_URL", "NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL"]) delete process.env[k]
assert.equal(getBaseUrl(), "http://localhost:3000")
process.env.NEXT_PUBLIC_APP_URL = "https://c.example"
assert.equal(getBaseUrl(), "https://c.example")
process.env.NEXTAUTH_URL = "https://b.example"
assert.equal(getBaseUrl(), "https://b.example")
process.env.BETTER_AUTH_URL = "https://a.example/"
assert.equal(getBaseUrl(), "https://a.example")
// The redirect guard follows the same origin.
assert.equal(normalizeCallbackUrl("https://a.example/x"), "/x")
assert.equal(normalizeCallbackUrl("https://c.example/x"), "/dashboard")

console.log("auth-pure: ok")
