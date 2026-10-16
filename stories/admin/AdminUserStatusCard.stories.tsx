import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AdminUserStatusCard from "../../components/dashboard/admin/adminUserStatusCard"
import { mockUser, mockUsers } from "../../.storybook/mocks"

const meta = {
  title: "Admin/AdminUserStatusCard",
  component: AdminUserStatusCard,
  args: { user: mockUser },
} satisfies Meta<typeof AdminUserStatusCard>
export default meta
type Story = StoryObj<typeof meta>

export const Active: Story = {}
export const Banned: Story = { args: { user: mockUsers[2] } }
export const NeverLoggedIn: Story = { args: { user: mockUsers[3] } }
