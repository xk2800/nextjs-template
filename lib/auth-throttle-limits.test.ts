import assert from "node:assert/strict"

import { isOverLimit, MAX, WINDOW_MS } from "./auth-throttle-limits"

const now = Date.now()

// No counter row for this device -> not limited.
assert.equal(isOverLimit(undefined, now), false)

// Live window, still under the cap -> not limited.
assert.equal(isOverLimit({ count: MAX - 1, windowStart: new Date(now - 1000) }, now), false)

// Live window, at the cap -> limited.
assert.equal(isOverLimit({ count: MAX, windowStart: new Date(now - 1000) }, now), true)

// Window already elapsed -> not limited even with a huge count (it resets on
// the next attempt). This is the direction that, if flipped, would lock a
// device out permanently.
assert.equal(
  isOverLimit({ count: MAX + 99, windowStart: new Date(now - WINDOW_MS - 1) }, now),
  false,
)

console.log("auth-throttle-limits: all assertions passed")
