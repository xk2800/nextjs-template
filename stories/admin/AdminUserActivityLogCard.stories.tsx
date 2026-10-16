import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AdminUserActivityLogCard from "../../components/dashboard/admin/adminUserActivityLogCard"
import { mockActivityLogs } from "../../.storybook/mocks"

const meta = {
  title: "Admin/AdminUserActivityLogCard",
  component: AdminUserActivityLogCard,
  args: { logs: mockActivityLogs },
} satisfies Meta<typeof AdminUserActivityLogCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Empty: Story = { args: { logs: [] } }
