import assert from "node:assert/strict"

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

console.log("auth-pure: ok")
