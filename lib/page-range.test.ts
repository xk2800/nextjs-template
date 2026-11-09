import assert from "node:assert/strict"

import { pageRange } from "../components/ui/data-table"

assert.deepEqual(pageRange(1, 1), [1])
assert.deepEqual(pageRange(1, 3), [1, 2, 3])
assert.deepEqual(pageRange(1, 10), [1, 2, "…", 10])
assert.deepEqual(pageRange(5, 10), [1, "…", 4, 5, 6, "…", 10])
assert.deepEqual(pageRange(10, 10), [1, "…", 9, 10])
// A one-page gap shows the page, never "…" standing in for a single number.
assert.deepEqual(pageRange(4, 10), [1, 2, 3, 4, 5, "…", 10])
assert.deepEqual(pageRange(7, 10), [1, "…", 6, 7, 8, 9, 10])
assert.deepEqual(pageRange(4, 7), [1, 2, 3, 4, 5, 6, 7])

console.log("page-range: all assertions passed")
