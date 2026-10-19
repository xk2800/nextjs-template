import assert from "node:assert"
import { nextVersion } from "./bump-version"

type Bump = "patch" | "minor" | "major"

// [current, bump, beta, expected] with no release history — the original
// `npm version` semantics (semver 7.6.3), so the prompt never lies.
const cases: [string, Bump, boolean, string][] = [
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
  assert.equal(nextVersion(v, type, beta), expected, `${v} ${type} beta=${beta}`)
}

// The real npm history: stable bumps come from the latest stable (0.6.0),
// never skipping to the beta line.
const released = [
  "0.6.0", "0.6.1-beta.0", "0.6.1-beta.1", "0.6.1-beta.2", "0.6.1-beta.3", "0.7.0-beta.0",
  ...[0, 1, 2, 3, 4, 5, 6].map((n) => `0.8.0-beta.${n}`),
]
const withHistory: [string, Bump, boolean, string][] = [
  ["0.8.0-beta.6", "patch", false, "0.6.1"],
  ["0.8.0-beta.6", "minor", false, "0.7.0"],
  ["0.8.0-beta.6", "major", false, "1.0.0"],
  ["0.8.0-beta.6", "patch", true, "0.8.0-beta.7"],
  // After shipping 0.7.0, a minor beta lands after the existing 0.8.0 betas.
  ["0.7.0", "minor", true, "0.8.0-beta.7"],
  ["0.7.0", "patch", true, "0.7.1-beta.0"],
  ["0.7.0", "minor", false, "0.8.0"],
]
for (const [v, type, beta, expected] of withHistory) {
  const history = v === "0.7.0" ? [...released, "0.7.0"] : released
  assert.equal(nextVersion(v, type, beta, history), expected, `${v} ${type} beta=${beta} (history)`)
}

console.log("bump-version: ok")
