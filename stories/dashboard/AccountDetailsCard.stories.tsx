import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AccountDetailsCard from "../../components/dashboard/accountDetailsCard"
import { mockUser } from "../../.storybook/mocks"

const meta = {
  title: "Dashboard/AccountDetailsCard",
  component: AccountDetailsCard,
  args: { user: mockUser },
} satisfies Meta<typeof AccountDetailsCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const UnverifiedEmail: Story = { args: { user: { ...mockUser, emailVerified: false, role: "user" } } }
