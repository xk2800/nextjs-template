import assert from "node:assert/strict"

import {
  MIN_CELL_WIDTH,
  recalculateColumns,
  type Column,
} from "./recalculate-columns"

const cols = (...names: string[]): Column[] =>
  names.map((name) => ({ name, title: name.toUpperCase() }))

// Names of auto-hidden columns, in column order.
const hidden = (r: { columns: Column[] }) =>
  r.columns.filter((c) => c.autoHide).map((c) => c.name)

// Everything fits -> nothing hidden.
{
  const r = recalculateColumns(cols("a", "b", "c"), 1000)
  assert.deepEqual(hidden(r), [])
  assert.equal(r.isCollapsed, false)
}

// Does not fit -> rightmost columns hidden first, loop stops once the rest fit.
{
  // 4 * 150 = 600; at width 320 only two columns fit -> drop "d" then "c".
  const r = recalculateColumns(cols("a", "b", "c", "d"), 320)
  assert.deepEqual(hidden(r), ["c", "d"])
  assert.equal(r.isCollapsed, true)
}

// Column 0 is never auto-hidden, even when a single column still overflows.
{
  const r = recalculateColumns(cols("a", "b"), 10)
  assert.deepEqual(hidden(r), ["b"])
  assert.equal(r.columns[0].autoHide, false)
}

const withPin = (): Column[] => [
  { name: "a", title: "A" },
  { name: "b", title: "B" },
  { name: "c", title: "C" },
  { name: "d", title: "D" },
  { name: "pin", title: "PIN", sticky: true },
]

// Sticky column stays pinned while active (width >= breakpoint), so a plain
// column to its left is dropped instead.
{
  const r = recalculateColumns(withPin(), 600) // 750 > 600, sticky active
  assert.deepEqual(hidden(r), ["d"])
  assert.equal(r.columns[4].autoHide, false)
}

// Below the breakpoint the sticky column behaves like a normal column and is hidable.
{
  const r = recalculateColumns(withPin(), 500) // 750 > 500, sticky inactive
  assert.deepEqual(hidden(r), ["d", "pin"])
}

// width 0 (unmeasured) -> nothing hidden regardless of column count.
{
  const r = recalculateColumns(cols("a", "b", "c", "d", "e"), 0)
  assert.deepEqual(hidden(r), [])
  assert.equal(r.isCollapsed, false)
}

// The minCellWidth option feeds the fit sum and changes the outcome.
{
  assert.deepEqual(hidden(recalculateColumns(cols("a", "b", "c"), 320)), ["c"])
  assert.deepEqual(
    hidden(recalculateColumns(cols("a", "b", "c"), 320, { minCellWidth: 100 })),
    [],
  )
}

// Per-column minWidth overrides the fallback in the sum.
{
  const c: Column[] = [
    { name: "a", title: "A", minWidth: 100 },
    { name: "b", title: "B", minWidth: 100 },
    { name: "c", title: "C", minWidth: 100 },
  ]
  assert.deepEqual(hidden(recalculateColumns(c, 250)), ["c"])
}

// Default fallback constant is applied when minWidth is absent.
{
  const r = recalculateColumns(cols("a", "b"), MIN_CELL_WIDTH * 2 - 1)
  assert.deepEqual(hidden(r), ["b"])
}

console.log("recalculate-columns: all assertions passed")
