"use client"

import * as React from "react"
import { Columns3 } from "lucide-react"

import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import type { Column } from "../../lib/recalculate-columns"

// Lets an app switch every table's "Columns" menu on/off in one place (e.g. from a feature flag).
const ColumnPickerContext = React.createContext(true)

export function ColumnPickerProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: React.ReactNode
}) {
  return (
    <ColumnPickerContext.Provider value={enabled}>
      {children}
    </ColumnPickerContext.Provider>
  )
}

/** Whether the per-user column picker is switched on. Defaults to `true` outside a provider. */
export function useColumnPickerEnabled() {
  return React.useContext(ColumnPickerContext)
}

const NONE: string[] = []
const storageKey = (tableId: string) => `data-table:hidden-columns:${tableId}`
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener) // other tabs
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function read(tableId: string | undefined) {
  if (!tableId) return null
  try {
    return localStorage.getItem(storageKey(tableId))
  } catch {
    return null
  }
}

/**
 * Hidden column names for `tableId`, saved in localStorage (per browser/device).
 * Stores the hidden set, so columns added to a table later default to visible.
 * The server snapshot is empty, so saved choices apply right after hydration.
 */
export function useHiddenColumns(tableId: string | undefined) {
  const raw = React.useSyncExternalStore(
    subscribe,
    () => read(tableId),
    () => null,
  )
  const hidden = React.useMemo<string[]>(() => {
    try {
      return raw ? JSON.parse(raw) : NONE
    } catch {
      return NONE
    }
  }, [raw])

  const setHidden = React.useCallback(
    (next: string[]) => {
      if (!tableId) return
      try {
        if (next.length) localStorage.setItem(storageKey(tableId), JSON.stringify(next))
        else localStorage.removeItem(storageKey(tableId))
      } catch {}
      listeners.forEach((l) => l())
    },
    [tableId],
  )

  return [hidden, setHidden] as const
}

/** Dropdown of checkboxes that shows/hides a table's columns, remembered per `tableId`. */
export function ColumnPicker<TRow>({
  tableId,
  columns,
}: {
  tableId: string
  columns: Column<TRow>[]
}) {
  const [hidden, setHidden] = useHiddenColumns(tableId)
  const toggle = (name: string) =>
    setHidden(hidden.includes(name) ? hidden.filter((c) => c !== name) : [...hidden, name])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" data-slot="column-picker">
          <Columns3 />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Show columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.name}
            checked={!hidden.includes(col.name)}
            onCheckedChange={() => toggle(col.name)}
            onSelect={(e) => e.preventDefault()} // stay open to toggle several
          >
            {col.title || col.name}
          </DropdownMenuCheckboxItem>
        ))}
        {hidden.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setHidden(NONE)}>
              Reset to default
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
