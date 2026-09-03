import assert from "node:assert/strict"

import { groupSharedDevices } from "./shared-devices"

const t = (iso: string) => new Date(iso)
const acc = (visitorId: string, userId: string, firstSeen: string, banned = false) => ({
  visitorId,
  userId,
  userName: `u-${userId}`,
  userEmail: `${userId}@x.com`,
  banned,
  firstSeenAt: t(firstSeen),
  userAgent: null,
  country: null,
  city: null,
})

// Rows newest-first, pre-join of device_fingerprint + user.
const rows = [
  acc("B", "u5", "2026-03-01"),
  acc("A", "u4", "2026-02-10"),
  acc("A", "u3", "2026-02-05"),
  acc("B", "u2", "2026-01-20", true),
  acc("A", "u1", "2026-01-10"),
  acc("C", "u6", "2026-04-01"), // lone account -> below threshold
]

const out = groupSharedDevices(rows, 3, 20)

// Only A (3 accounts) clears the threshold of 3; B has 2, C has 1.
assert.deepEqual(out.map((d) => d.visitorId), ["A"])
assert.equal(out[0].accountCount, 3)

// lastSeenAt = newest firstSeenAt in the group, regardless of row order.
assert.equal(out[0].lastSeenAt.toISOString(), t("2026-02-10").toISOString())

// Every account carried through, banned flag included.
assert.deepEqual(out[0].accounts.map((a) => a.userId), ["u4", "u3", "u1"])

// Lower the threshold: A (3) sorts before B (2); banned flag survives.
const both = groupSharedDevices(rows, 2, 20)
assert.deepEqual(both.map((d) => d.visitorId), ["A", "B"])
assert.equal(both[1].accounts.find((a) => a.userId === "u2")?.banned, true)

// limit caps the number of devices returned.
assert.equal(groupSharedDevices(rows, 2, 1).length, 1)

console.log("shared-devices: all assertions passed")
