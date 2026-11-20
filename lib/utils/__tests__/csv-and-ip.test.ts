import assert from "node:assert/strict"

import { mock } from "bun:test"

import { toCsv } from "../csv"

// request-info is server-only; mock the guard, then import it after.
mock.module("server-only", () => ({}))
const { getClientIp } = await import("../request-info")

// CSV injection guard: strings starting with = + - @ become text, numbers stay numbers.
const csv = toCsv(["a"], [["=1+1"], ["-5"], [-5], ['=HYPERLINK("http://x")']])
const lines = csv.slice(1).split("\r\n")
assert.equal(lines[1], "'=1+1")
assert.equal(lines[2], "'-5") // a string "-5" is treated as text
assert.equal(lines[3], "-5") // a real number is untouched
assert.ok(lines[4].startsWith(`"'=HYPERLINK(`))

// Only the last X-Forwarded-For entry is trusted (added by our own proxy).
assert.equal(getClientIp(new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" })), "2.2.2.2")
assert.equal(getClientIp(new Headers({ "x-real-ip": "3.3.3.3" })), "3.3.3.3")
assert.equal(getClientIp(null), null)

console.log("csv-and-ip: ok")
