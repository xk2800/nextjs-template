import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import ActivityLogsSection from "../../components/dashboard/activityLogsSection"
import { mockUser } from "../../.storybook/mocks"

const meta = {
  title: "Dashboard/ActivityLogsSection",
  component: ActivityLogsSection,
  args: { userId: mockUser.id, isAdmin: false },
} satisfies Meta<typeof ActivityLogsSection>
export default meta
type Story = StoryObj<typeof meta>

/** Async server component: loads logs (mocked), renders ActivityLogsCard. */
export const Default: Story = {}
export const AdminView: Story = { args: { isAdmin: true } }
