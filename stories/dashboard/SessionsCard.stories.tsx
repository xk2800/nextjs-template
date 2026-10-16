import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import SessionsCard from "../../components/dashboard/sessionsCard"
import { mockSessions, mockUser } from "../../.storybook/mocks"

const meta = {
  title: "Dashboard/SessionsCard",
  component: SessionsCard,
  args: { userId: mockUser.id, initialSessions: mockSessions, currentSessionToken: "current-token", enableSessionRevocation: true },
} satisfies Meta<typeof SessionsCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const RevocationDisabled: Story = { args: { enableSessionRevocation: false } }
export const SingleSession: Story = { args: { initialSessions: mockSessions.slice(0, 1) } }
