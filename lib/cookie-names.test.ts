import assert from "node:assert"
import { consentAllows } from "./cookie-names"

assert.equal(consentAllows("all", "fingerprint"), true)
assert.equal(consentAllows("all", "onetap"), true)
assert.equal(consentAllows("necessary", "fingerprint"), false)
assert.equal(consentAllows(undefined, "fingerprint"), false) // no choice yet
assert.equal(consentAllows("", "onetap"), false)
// one purpose per choice — "Customize" picks are independent
assert.equal(consentAllows("fingerprint", "fingerprint"), true)
assert.equal(consentAllows("fingerprint", "onetap"), false)
assert.equal(consentAllows("onetap", "fingerprint"), false)
assert.equal(consentAllows("fingerprint,onetap", "onetap"), true)
// exact names, not substrings
assert.equal(consentAllows("fingerprints", "fingerprint"), false)

console.log("cookie-names: ok")
