import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import SessionsSection from "../../components/dashboard/sessionsSection"
import { mockUser } from "../../.storybook/mocks"

const meta = {
  title: "Dashboard/SessionsSection",
  component: SessionsSection,
  args: { userId: mockUser.id },
} satisfies Meta<typeof SessionsSection>
export default meta
type Story = StoryObj<typeof meta>

/** Async server component: loads sessions + settings (mocked), renders SessionsCard. */
export const Default: Story = {}
