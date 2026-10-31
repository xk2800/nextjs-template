import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ColumnPicker } from "../../components/ui/column-picker"

/** Standalone menu. `DataTable` renders this for you when given a `tableId`. */
const meta = {
  title: "UI/ColumnPicker",
  component: ColumnPicker,
  args: {
    tableId: "storybook-column-picker",
    columns: [
      { name: "email", title: "Email" },
      { name: "role", title: "Role" },
      { name: "status", title: "Status" },
    ],
  },
} satisfies Meta<typeof ColumnPicker>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
