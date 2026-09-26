import assert from "node:assert"
import { isMaintenanceExempt, DEFAULT_MAINTENANCE_EXEMPT_PATHS as D } from "./maintenance"

assert.equal(isMaintenanceExempt("/", D), true)
assert.equal(isMaintenanceExempt("/features", D), true)
assert.equal(isMaintenanceExempt("/changelog/v1", D), true)
assert.equal(isMaintenanceExempt("/changelogs", D), false) // segment match, not substring
assert.equal(isMaintenanceExempt("/dashboard", D), false)
assert.equal(isMaintenanceExempt("/signup", D), false)
assert.equal(isMaintenanceExempt("/api/heartbeat", D), false)
// always-open paths survive an empty admin list
assert.equal(isMaintenanceExempt("/login/2fa", []), true)
assert.equal(isMaintenanceExempt("/api/auth/sign-in/email", []), true)
assert.equal(isMaintenanceExempt("/", []), false)
// "/" in the list doesn't open everything; trailing slash tolerated
assert.equal(isMaintenanceExempt("/dashboard", ["/"]), false)
assert.equal(isMaintenanceExempt("/dashboard/settings", ["/dashboard/"]), true)

console.log("maintenance: ok")
