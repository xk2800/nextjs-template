import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import ActivityLogsCard from "../../components/dashboard/activityLogsCard"
import { mockActivityLogs } from "../../.storybook/mocks"

const meta = {
  title: "Dashboard/ActivityLogsCard",
  component: ActivityLogsCard,
  args: { initialLogs: mockActivityLogs },
} satisfies Meta<typeof ActivityLogsCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const AdminView: Story = { args: { isAdmin: true } }
export const Empty: Story = { args: { initialLogs: [] } }
