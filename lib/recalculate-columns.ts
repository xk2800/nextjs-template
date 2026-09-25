import type { ReactNode } from "react"

/**
 * Container-width-based column collapsing. Pure — no DOM or React runtime dependency,
 * so it is trivially unit-testable. The `<DataTable>` component feeds it the wrapper's
 * measured width on every resize.
 */

/** Fallback width for a column that does not declare its own `minWidth`. */
export const MIN_CELL_WIDTH = 150

/** Below this width, `sticky` columns stop being pinned and can be auto-hidden too. */
export const STICKY_BREAKPOINT = 577

/** Rendered width of the row-toggle column (w-8 + cell padding) shown once collapsed. */
export const EXPANDER_WIDTH = 48

export type Column<TRow = Record<string, unknown>> = {
  name: string
  title: ReactNode
  minWidth?: number
  maxWidth?: number
  /** Pinned column — only kept from auto-hiding while width >= the sticky breakpoint. */
  sticky?: boolean
  /** Set by `recalculateColumns` — the column did not fit and moved into the detail row. */
  autoHide?: boolean
  renderer?: (row: TRow) => ReactNode
}

export type RecalcOptions = {
  /** Fallback when a column has no `minWidth`. Defaults to {@link MIN_CELL_WIDTH}. */
  minCellWidth?: number
  /** `sticky` columns are pinned only at width >= this. Defaults to {@link STICKY_BREAKPOINT}. */
  stickyBreakpoint?: number
}

export type RecalcResult<TRow = Record<string, unknown>> = {
  /** Same order as the input, with `autoHide` set on the columns that did not fit. */
  columns: Column<TRow>[]
  /** True when at least one column was auto-hidden. */
  isCollapsed: boolean
}

/**
 * Decide which columns fit in `width`. Sums each visible column's `minWidth`
 * (or `minCellWidth`); if the total exceeds `width`, walks right-to-left marking
 * columns `autoHide` until the rest fit. Column 0 is always kept as an anchor, and
 * active `sticky` columns are skipped.
 */
export function recalculateColumns<TRow>(
  columns: Column<TRow>[],
  width: number,
  opts: RecalcOptions = {},
): RecalcResult<TRow> {
  const minCell = opts.minCellWidth ?? MIN_CELL_WIDTH
  const stickyActive = width >= (opts.stickyBreakpoint ?? STICKY_BREAKPOINT)
  const cellW = (c: Column<TRow>) => c.minWidth ?? minCell

  const next = columns.map((c) => ({ ...c, autoHide: false }))
  if (!(width > 0)) return { columns: next, isCollapsed: false } // unmeasured (SSR / first paint)

  let predicted = next.reduce((sum, c) => sum + cellW(c), 0)
  if (predicted <= width) return { columns: next, isCollapsed: false }
  predicted += EXPANDER_WIDTH // collapsing adds the row-toggle column

  // Walk right -> left; stop at index 1 so column 0 always stays as an anchor.
  for (let i = next.length - 1; i >= 1 && predicted > width; i--) {
    const c = next[i]
    if (c.sticky && stickyActive) continue // pinned & active -> keep
    c.autoHide = true
    predicted -= cellW(c)
  }

  return { columns: next, isCollapsed: next.some((c) => c.autoHide) }
}
