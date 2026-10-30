import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Badge } from "../../components/ui/badge"
import { DataTable, type Column } from "../../components/ui/data-table"
import { mockUsers } from "../../.storybook/mocks"

type U = (typeof mockUsers)[number]
const columns: Column<U>[] = [
  { name: "name", title: "Name", sticky: true, renderer: (u) => u.name ?? "—" },
  { name: "email", title: "Email", minWidth: 200, renderer: (u) => u.email },
  { name: "role", title: "Role", renderer: (u) => <Badge variant="outline">{u.role}</Badge> },
  { name: "status", title: "Status", renderer: (u) => (u.banned ? <Badge variant="destructive">Banned</Badge> : <Badge>Active</Badge>) },
]

const meta = {
  title: "UI/DataTable",
  component: DataTable<U>,
  args: { columns, data: mockUsers, getRowId: (u) => u.id },
} satisfies Meta<typeof DataTable<U>>
export default meta
type Story = StoryObj<typeof meta>

/** Narrow the canvas: overflowing columns collapse into an expandable row. */
export const Default: Story = {}
export const HorizontalScroll: Story = { args: { autoCollapse: false } }
export const Paginated: Story = { args: { pageSize: 2 } }
export const CustomExpandedRow: Story = { args: { expandRenderer: (u) => <p className="p-3 text-sm">Custom details for {u.email}</p> } }
export const Empty: Story = { args: { data: [] } }
/** `align` on a column sets the header and cell alignment ("left" | "center" | "right"; default left). */
export const ColumnAlignment: Story = {
  args: {
    columns: [
      ...columns,
      { name: "verified", title: "Verified", align: "center", renderer: (u) => (u.emailVerified ? "✓" : "—") },
      { name: "actions", title: "Actions", align: "right", renderer: () => <Badge variant="secondary">Edit</Badge> },
    ],
  },
}
