import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AdminActivityLogsTable from "../../components/dashboard/admin/adminActivityLogsTable"
import { mockActivityLogs } from "../../.storybook/mocks"

const meta = {
  title: "Admin/AdminActivityLogsTable",
  component: AdminActivityLogsTable,
  args: { initialLogs: mockActivityLogs, initialPagination: { page: 1, limit: 20, total: 140, pages: 7 } },
} satisfies Meta<typeof AdminActivityLogsTable>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Empty: Story = { args: { initialLogs: [], initialPagination: { page: 1, limit: 20, total: 0, pages: 0 } } }
