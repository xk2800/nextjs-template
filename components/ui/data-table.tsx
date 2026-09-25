"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { useDimensions } from "../../hooks/use-dimensions"
import {
  MIN_CELL_WIDTH,
  STICKY_BREAKPOINT,
  recalculateColumns,
  type Column,
} from "../../lib/recalculate-columns"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

export { MIN_CELL_WIDTH, STICKY_BREAKPOINT, recalculateColumns }
export type { Column }

function renderCell<TRow>(col: Column<TRow>, row: TRow): React.ReactNode {
  if (col.renderer) return col.renderer(row)
  const value = (row as Record<string, unknown>)[col.name]
  return value == null ? "" : String(value)
}

/** Detail list for the columns that were auto-hidden from a given row. */
export function ExpandedRow<TRow>({
  row,
  columns,
}: {
  row: TRow
  columns: Column<TRow>[]
}) {
  return (
    <ul data-slot="data-table-detail-list" className="grid gap-1 py-1 text-sm">
      {columns.map((col) => (
        <li key={col.name} className="flex gap-2">
          <span className="text-muted-foreground min-w-24 font-medium">
            {col.title}
          </span>
          <span>{renderCell(col, row)}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Page numbers to show: first, last, and the current page ±1, with "…" filling gaps.
 * A gap of exactly one page shows that page instead of "…" (1 2 3 not 1 … 3).
 */
export function pageRange(page: number, pages: number): (number | "…")[] {
  const out: (number | "…")[] = []
  for (let p = 1; p <= pages; p++) {
    const near = p === 1 || p === pages || Math.abs(p - page) <= 1
    const bridges = (p === 2 && page === 4) || (p === pages - 1 && page === pages - 3)
    if (near || bridges) out.push(p)
    else if (out[out.length - 1] !== "…") out.push("…")
  }
  return out
}

/** Numbered pager. Renders nothing for a single page. Also used by server-paginated tables. */
export function DataTablePagination({
  page,
  pages,
  onPageChange,
  className,
}: {
  page: number
  pages: number
  onPageChange: (page: number) => void
  className?: string
}) {
  if (pages <= 1) return null
  return (
    <nav
      aria-label="Pagination"
      data-slot="data-table-pagination"
      className={cn(
        "mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-4",
        className,
      )}
    >
      <p className="text-muted-foreground text-sm">
        Page {page} of {pages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        {pageRange(page, pages).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="text-muted-foreground px-1 text-sm">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className="tabular-nums"
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}

export type DataTableProps<TRow> = {
  columns: Column<TRow>[]
  data: TRow[]
  getRowId: (row: TRow) => string
  /** Auto-hide overflowing columns into a per-row detail panel. Default `true`. */
  autoCollapse?: boolean
  /**
   * Caller supplies its own per-row detail UI. Its presence turns column collapsing
   * off — the table falls back to horizontal scroll instead.
   */
  expandRenderer?: (row: TRow) => React.ReactNode
  minCellWidth?: number
  stickyBreakpoint?: number
  /** Rows per page (client-side). Default `10`; `false` renders every row (e.g. server-paginated data). */
  pageSize?: number | false
  className?: string
}

export function DataTable<TRow>({
  columns,
  data,
  getRowId,
  autoCollapse = true,
  expandRenderer,
  minCellWidth,
  stickyBreakpoint,
  pageSize = 10,
  className,
}: DataTableProps<TRow>) {
  const { observe, width } = useDimensions()
  const collapseEnabled = autoCollapse && !expandRenderer
  const minCell = minCellWidth ?? MIN_CELL_WIDTH

  const [colState, setColState] = React.useState<Column<TRow>[]>(() =>
    columns.map((c) => ({ ...c, autoHide: false })),
  )
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set())

  // Re-seed when the column definitions change (incl. a manual visibility toggle
  // that swaps the array). React re-runs the render immediately, no repaint.
  const columnsRef = React.useRef(columns)
  const hiddenSigRef = React.useRef("")
  if (columnsRef.current !== columns) {
    columnsRef.current = columns
    hiddenSigRef.current = ""
    setColState(columns.map((c) => ({ ...c, autoHide: false })))
  }

  // Recompute the fitting set on every measured-width change. Only commit when the
  // auto-hidden set actually changed, so ResizeObserver can't drive a render loop.
  React.useEffect(() => {
    if (!collapseEnabled) return
    const next = recalculateColumns(columns, width, {
      minCellWidth,
      stickyBreakpoint,
    })
    const sig = next.columns
      .filter((c) => c.autoHide)
      .map((c) => c.name)
      .join("|")
    if (sig !== hiddenSigRef.current) {
      hiddenSigRef.current = sig
      setColState(next.columns)
    }
  }, [width, columns, collapseEnabled, minCellWidth, stickyBreakpoint])

  const visible = collapseEnabled
    ? colState.filter((c) => !c.autoHide)
    : colState
  const hidden = collapseEnabled ? colState.filter((c) => c.autoHide) : []
  const isCollapsed = hidden.length > 0

  const [page, setPage] = React.useState(1)
  const pages = pageSize ? Math.max(1, Math.ceil(data.length / pageSize)) : 1
  const current = Math.min(page, pages) // clamp when data shrinks
  const rows = pageSize
    ? data.slice((current - 1) * pageSize, current * pageSize)
    : data

  const toggleRow = React.useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <div className={className}>
      <div
        ref={observe}
        data-slot="data-table"
        // Always scrollable: if column 0 alone is wider than the container it scrolls instead of spilling out
        className="relative w-full overflow-x-auto"
      >
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            <TableRow>
              {isCollapsed && (
                <TableHead className="w-8">
                  <span className="sr-only">Row details</span>
                </TableHead>
              )}
              {visible.map((col) => (
                <TableHead
                  key={col.name}
                  style={{ minWidth: col.minWidth ?? minCell, maxWidth: col.maxWidth }}
                >
                  {col.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const id = getRowId(row)
              const open = expanded.has(id)
              return (
                <React.Fragment key={id}>
                  <TableRow>
                    {isCollapsed && (
                      <TableCell className="w-8 align-top">
                        <button
                          type="button"
                          onClick={() => toggleRow(id)}
                          aria-expanded={open}
                          aria-label={open ? "Hide row details" : "Show row details"}
                          className="hover:bg-muted flex size-6 items-center justify-center rounded-sm"
                        >
                          <ChevronRight
                            className={cn(
                              "size-4 transition-transform",
                              open && "rotate-90",
                            )}
                          />
                        </button>
                      </TableCell>
                    )}
                    {visible.map((col) => (
                      <TableCell
                        key={col.name}
                        className="whitespace-normal break-words align-top"
                        style={{ maxWidth: col.maxWidth }}
                      >
                        {renderCell(col, row)}
                      </TableCell>
                    ))}
                  </TableRow>
                  {isCollapsed && open && (
                    <TableRow data-slot="data-table-expanded-row">
                      <TableCell colSpan={visible.length + 1} className="bg-muted/50">
                        <ExpandedRow row={row} columns={hidden} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </table>
      </div>
      <DataTablePagination page={current} pages={pages} onPageChange={setPage} />
    </div>
  )
}
