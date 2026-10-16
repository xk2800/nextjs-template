import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AdminUserActivityLogTable from "../../components/dashboard/admin/adminUserActivityLogTable"
import { mockActivityLogs } from "../../.storybook/mocks"

const rows = mockActivityLogs.map((l) => ({ ...l, referrerUrl: "https://google.com/", device: l.deviceLabel, location: l.location }))

const meta = {
  title: "Admin/AdminUserActivityLogTable",
  component: AdminUserActivityLogTable,
  args: { rows },
} satisfies Meta<typeof AdminUserActivityLogTable>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
