import assert from "node:assert"
import { consentAllows, isValidConsent } from "./cookie-names"

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

// what app/api/consent accepts
assert.equal(isValidConsent("all"), true)
assert.equal(isValidConsent("necessary"), true)
assert.equal(isValidConsent("fingerprint"), true)
assert.equal(isValidConsent("onetap,fingerprint"), true)
assert.equal(isValidConsent("fingerprint,fingerprint"), false) // duplicates
assert.equal(isValidConsent("analytics"), false) // unknown purpose
assert.equal(isValidConsent(""), false)
assert.equal(isValidConsent(null), false)
assert.equal(isValidConsent(["all"]), false)

console.log("cookie-names: ok")
