"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"

import { cn } from "../../lib/utils"
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

export type DataTableProps<TRow extends Record<string, unknown>> = {
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
  className?: string
}

export function DataTable<TRow extends Record<string, unknown>>({
  columns,
  data,
  getRowId,
  autoCollapse = true,
  expandRenderer,
  minCellWidth,
  stickyBreakpoint,
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

  const toggleRow = React.useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <div
      ref={observe}
      data-slot="data-table"
      className={cn("relative w-full", !collapseEnabled && "overflow-x-auto", className)}
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
          {data.map((row) => {
            const id = getRowId(row)
            const open = expanded.has(id)
            return (
              <React.Fragment key={id}>
                <TableRow>
                  {isCollapsed && (
                    <TableCell className="w-8">
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
                    <TableCell key={col.name} style={{ maxWidth: col.maxWidth }}>
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
  )
}
