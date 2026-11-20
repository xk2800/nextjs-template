// Every app/api/admin/** handler must answer 401 with no session and 403 for a
// non-admin, and proxy() must keep the /dashboard login redirect. Auth and the
// DB are mocked: the gate runs before any query, so a handler that touches the
// DB for these requests fails the test.
import { mock } from "bun:test"
import assert from "node:assert/strict"
import { readdirSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import { NextRequest } from "next/server"

const root = resolve(import.meta.dir, "../../..")
let current: unknown = null

mock.module("server-only", () => ({}))
mock.module(join(root, "server/auth.ts"), () => ({
  auth: { api: { getSession: async () => current } },
}))
mock.module(join(root, "server/db/index.ts"), () => ({
  db: new Proxy({}, { get: () => { throw new Error("handler touched the DB before the admin gate") } }),
}))
mock.module(join(root, "config/env.ts"), () => ({ config: {} }))
mock.module("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }))
let settings = { maintenanceMode: false, maintenanceExemptPaths: [] as string[] }
// Keep the real module's other exports (routes import them); only the read is faked.
const realSettings = await import(join(root, "lib/db/queries/settings.ts"))
mock.module(join(root, "lib/db/queries/settings.ts"), () => ({
  ...realSettings,
  getSystemSettings: async () => settings,
  isConsentRequired: () => false,
}))

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? routeFiles(p) : name === "route.ts" ? [p] : []
  })
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"]
const files = routeFiles(join(root, "app/api/admin"))
assert.ok(files.length >= 15, `expected the admin routes, found ${files.length}`)

let checked = 0
for (const file of files) {
  const mod = await import(file)
  const handlers = METHODS.filter((m) => typeof mod[m] === "function")
  assert.ok(handlers.length, `${file} exports no handler`)
  for (const method of handlers) {
    const call = () =>
      mod[method](
        new NextRequest("http://localhost/api/admin/x", { method, body: method === "GET" ? undefined : "{}" }),
        { params: Promise.resolve({ userId: "u", id: "i" }) },
      ) as Promise<Response>

    current = null
    assert.equal((await call()).status, 401, `${method} ${file}: no session`)

    current = { user: { id: "u1", role: "user", email: "u@x.com" }, session: {} }
    assert.equal((await call()).status, 403, `${method} ${file}: non-admin`)
    checked++
  }
}

// proxy.ts: login redirect keeps the query string; maintenance mode gates pages.
const { proxy } = await import(join(root, "proxy.ts"))
const loc = async (path: string, cookie?: string) =>
  proxy(new NextRequest(`http://localhost${path}`, { headers: cookie ? { cookie } : {} }))

let res = await loc("/dashboard?x=1")
assert.equal(res.headers.get("location"), "http://localhost/login?callbackUrl=%2Fdashboard%3Fx%3D1")
res = await loc("/dashboard", "better-auth.session_token=abc")
assert.equal(res.headers.get("location"), null, "a session cookie passes the optimistic gate")

settings = { maintenanceMode: true, maintenanceExemptPaths: [] }
current = null
res = await loc("/pricing")
assert.equal(res.headers.get("location"), "http://localhost/maintenance")
res = await loc("/api/anything")
assert.equal(res.status, 503)
current = { user: { role: "admin" }, session: {} }
res = await loc("/pricing", "better-auth.session_token=abc")
assert.equal(res.headers.get("location"), null, "admins bypass maintenance")

console.log(`admin-routes: ok (${checked} handlers)`)
