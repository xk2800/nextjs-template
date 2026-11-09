import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import TwoFactorCard from "../../components/dashboard/twoFactorCard"
import { mockSessions, mockUser } from "../../.storybook/mocks"

const meta = {
  title: "Dashboard/TwoFactorCard",
  component: TwoFactorCard,
} satisfies Meta<typeof TwoFactorCard>
export default meta
type Story = StoryObj<typeof meta>

export const Disabled: Story = {}
export const Enabled: Story = { parameters: { session: { user: { ...mockUser, twoFactorEnabled: true }, session: mockSessions[0] } } }
