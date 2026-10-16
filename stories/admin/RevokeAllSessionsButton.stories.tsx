import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import RevokeAllSessionsButton from "../../components/dashboard/admin/revokeAllSessionsButton"
import { mockUser } from "../../.storybook/mocks"

const meta = {
  title: "Admin/RevokeAllSessionsButton",
  component: RevokeAllSessionsButton,
  args: { userId: mockUser.id },
} satisfies Meta<typeof RevokeAllSessionsButton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Small: Story = { args: { size: "sm", label: "Revoke sessions" } }
