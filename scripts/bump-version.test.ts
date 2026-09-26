import assert from "node:assert"
import { nextVersion } from "./bump-version"

// [current, bump, beta, expected] — expected values generated with the
// semver that `npm version` uses (7.6.3), so the prompt never lies.
const cases: [string, "patch" | "minor" | "major", boolean, string][] = [
  ["0.5.3", "patch", false, "0.5.4"],
  ["0.5.3", "patch", true, "0.5.4-beta.0"],
  ["0.5.3", "minor", false, "0.6.0"],
  ["0.5.3", "minor", true, "0.6.0-beta.0"],
  ["0.5.3", "major", false, "1.0.0"],
  ["0.5.3", "major", true, "1.0.0-beta.0"],
  ["0.5.4-beta.0", "patch", false, "0.5.4"],
  ["0.5.4-beta.0", "patch", true, "0.5.4-beta.1"],
  ["0.5.4-beta.0", "minor", false, "0.6.0"],
  ["0.5.4-beta.0", "minor", true, "0.6.0-beta.0"],
  ["0.5.4-beta.0", "major", false, "1.0.0"],
  ["0.5.4-beta.0", "major", true, "1.0.0-beta.0"],
  ["0.6.0-beta.2", "patch", false, "0.6.0"],
  ["0.6.0-beta.2", "patch", true, "0.6.0-beta.3"],
  ["0.6.0-beta.2", "minor", false, "0.6.0"],
  ["0.6.0-beta.2", "minor", true, "0.7.0-beta.0"],
  ["0.6.0-beta.2", "major", false, "1.0.0"],
  ["0.6.0-beta.2", "major", true, "1.0.0-beta.0"],
  ["1.0.0-beta.1", "patch", false, "1.0.0"],
  ["1.0.0-beta.1", "patch", true, "1.0.0-beta.2"],
  ["1.0.0-beta.1", "minor", false, "1.0.0"],
  ["1.0.0-beta.1", "minor", true, "1.1.0-beta.0"],
  ["1.0.0-beta.1", "major", false, "1.0.0"],
  ["1.0.0-beta.1", "major", true, "2.0.0-beta.0"],
]

for (const [v, type, beta, expected] of cases) {
  assert.equal(nextVersion(v, type, beta).version, expected, `${v} ${type} beta=${beta}`)
}

console.log("bump-version: ok")
