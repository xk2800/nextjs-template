"use client"

import * as React from "react"

import { DataTable, type Column } from "@/components/ui/data-table"
import { useDimensions } from "@/hooks/use-dimensions"

type Person = {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "invited" | "suspended"
  createdAt: string
  lastSeen: string
}

const rows: Person[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com", role: "admin", status: "active", createdAt: "2023-01-04", lastSeen: "2 hours ago" },
  { id: "2", name: "Alan Turing", email: "alan@example.com", role: "admin", status: "active", createdAt: "2023-02-11", lastSeen: "yesterday" },
  { id: "3", name: "Grace Hopper", email: "grace@example.com", role: "user", status: "invited", createdAt: "2023-03-19", lastSeen: "never" },
  { id: "4", name: "Katherine Johnson", email: "katherine@example.com", role: "user", status: "active", createdAt: "2023-04-27", lastSeen: "5 days ago" },
  { id: "5", name: "Edsger Dijkstra", email: "edsger@example.com", role: "user", status: "suspended", createdAt: "2023-06-02", lastSeen: "3 weeks ago" },
  { id: "6", name: "Barbara Liskov", email: "barbara@example.com", role: "admin", status: "active", createdAt: "2023-07-15", lastSeen: "1 hour ago" },
  { id: "7", name: "Donald Knuth", email: "donald@example.com", role: "user", status: "active", createdAt: "2023-09-08", lastSeen: "10 minutes ago" },
  { id: "8", name: "Margaret Hamilton", email: "margaret@example.com", role: "user", status: "invited", createdAt: "2023-11-23", lastSeen: "never" },
]

const dot: Record<Person["status"], string> = {
  active: "bg-green-500",
  invited: "bg-yellow-500",
  suspended: "bg-red-500",
}

const columns: Column<Person>[] = [
  { name: "name", title: "Name", sticky: true, minWidth: 160 },
  { name: "email", title: "Email", minWidth: 200 },
  { name: "role", title: "Role", minWidth: 100 },
  {
    name: "status",
    title: "Status",
    minWidth: 120,
    renderer: (row) => (
      <span className="flex items-center gap-2 capitalize">
        <span className={`size-2 rounded-full ${dot[row.status]}`} />
        {row.status}
      </span>
    ),
  },
  { name: "createdAt", title: "Created", minWidth: 130 },
  { name: "lastSeen", title: "Last seen", minWidth: 130 },
]

export default function DataTableDemoPage() {
  const { observe, width } = useDimensions()
  const [autoCollapse, setAutoCollapse] = React.useState(true)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">DataTable</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Container-query demo. Drag the bottom-right handle of the box to resize
          it — columns fold into the expandable detail row based on the box width,
          not the viewport.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={autoCollapse}
          onChange={(e) => setAutoCollapse(e.target.checked)}
        />
        auto-collapse columns (uncheck to fall back to horizontal scroll)
      </label>

      <div className="text-muted-foreground text-xs">
        container width: {Math.round(width)}px
      </div>

      <div
        ref={observe}
        className="resize-x overflow-auto rounded-md border"
        style={{ width: 960, minWidth: 280, maxWidth: "100%" }}
      >
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          autoCollapse={autoCollapse}
        />
      </div>
    </div>
  )
}
