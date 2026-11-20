// The before-hook guards in server/auth.ts, exercised through the real
// createAuth() handler: the plugin's /admin/* endpoints are closed over HTTP
// (they skip our audit log), and the last active admin can't delete themself.
// The DB and the session lookup are faked; the hook runs before any endpoint.
import { mock } from "bun:test"
import assert from "node:assert/strict"
import { join, resolve } from "node:path"

const root = resolve(import.meta.dir, "../../..")
let session: unknown = null
let otherAdminRows: unknown[] = []

mock.module("server-only", () => ({}))
mock.module(join(root, "config/env.ts"), () => ({
  config: { AUTH_ENABLE_EMAIL_PASSWORD: true, APP_NAME: "Test", ENABLE_SESSION_REVOCATION: false },
}))
// Chainable stand-in: any select().from().where().limit() resolves to otherAdminRows.
const chain: any = new Proxy(() => {}, {
  get: (_t, prop) => (prop === "then" ? (res: (v: unknown) => void) => res(otherAdminRows) : chain),
  apply: () => chain,
})
mock.module(join(root, "server/db/index.ts"), () => ({ db: chain }))
const realApi = await import("better-auth/api")
mock.module("better-auth/api", () => ({ ...realApi, getSessionFromCtx: async () => session }))
process.env.BETTER_AUTH_SECRET = "x".repeat(40)
process.env.BETTER_AUTH_URL = "http://localhost:3000"

const { createAuth } = await import(join(root, "server/auth.ts"))
const auth = createAuth()

const post = (path: string, body: unknown = {}) =>
  auth.handler(new Request(`http://localhost:3000/api/auth${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000" },
    body: JSON.stringify(body),
  }))

// Plugin admin endpoints are blocked over HTTP, whatever the session.
session = { user: { id: "a1", role: "admin" }, session: {} }
for (const path of ["/admin/set-user-password", "/admin/set-role", "/admin/ban-user", "/admin/remove-user", "/admin/create-user"]) {
  const res = await post(path)
  assert.equal(res.status, 403, path)
  assert.match(((await res.json()) as { message: string }).message, /dashboard/, path)
}
// ...but impersonation isn't caught by that guard.
for (const path of ["/admin/impersonate-user", "/admin/stop-impersonating"]) {
  const res = await post(path)
  const body = (await res.json().catch(() => ({}))) as { message?: string }
  assert.doesNotMatch(body.message ?? "", /Use the dashboard/, path)
}

// Last-admin self-delete: refused when no other active admin remains, allowed otherwise.
session = { user: { id: "a1", role: "admin" }, session: {} }
otherAdminRows = []
const refused = await post("/delete-user")
assert.equal(refused.status, 403)
assert.match(((await refused.json()) as { message: string }).message, /only admin/)

otherAdminRows = [{ n: 1 }]
const allowed = await post("/delete-user")
assert.doesNotMatch(await allowed.text(), /only admin/)

session = { user: { id: "a1", role: "admin" }, session: { impersonatedBy: "a2" } }
assert.equal((await post("/delete-user")).status, 403) // impersonating

console.log("auth-hooks: ok")
