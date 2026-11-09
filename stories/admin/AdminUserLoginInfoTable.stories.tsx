import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AdminUserLoginInfoTable from "../../components/dashboard/admin/adminUserLoginInfoTable"
import { mockLoginHistory } from "../../.storybook/mocks"

const rows = mockLoginHistory.map((l) => ({
  id: l.id,
  isRegistration: l.description.includes("registered"),
  device: `${l.browser} on ${l.os}`,
  location: `${l.city}, ${l.country}`,
  referrerUrl: l.referrerUrl,
  ipAddress: l.ipAddress,
  createdAt: l.createdAt,
}))

const meta = {
  title: "Admin/AdminUserLoginInfoTable",
  component: AdminUserLoginInfoTable,
  args: { rows },
} satisfies Meta<typeof AdminUserLoginInfoTable>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
