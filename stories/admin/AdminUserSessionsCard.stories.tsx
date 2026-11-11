import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AdminUserSessionsCard from "../../components/dashboard/admin/users/detail/admin-user-sessions-card"
import { mockSessions, mockUser } from "../../.storybook/mocks"

const meta = {
  title: "Admin/AdminUserSessionsCard",
  component: AdminUserSessionsCard,
  args: { userId: mockUser.id, initialSessions: mockSessions },
} satisfies Meta<typeof AdminUserSessionsCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const NoSessions: Story = { args: { initialSessions: [] } }
