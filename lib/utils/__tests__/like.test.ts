import assert from "node:assert/strict"

import { containsPattern } from "../like"

assert.equal(containsPattern("alice"), "%alice%")
assert.equal(containsPattern("john_doe"), "%john\\_doe%")
assert.equal(containsPattern("50%"), "%50\\%%")
assert.equal(containsPattern("a\\b"), "%a\\\\b%")

console.log("like: ok")
