import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AdminUserLoginInfoCard from "../../components/dashboard/admin/adminUserLoginInfoCard"
import { mockLoginHistory } from "../../.storybook/mocks"

const meta = {
  title: "Admin/AdminUserLoginInfoCard",
  component: AdminUserLoginInfoCard,
  args: { logins: mockLoginHistory },
} satisfies Meta<typeof AdminUserLoginInfoCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Empty: Story = { args: { logins: [] } }
