import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import ActivityLogsSection from "../../components/dashboard/admin/activityLogsSection"

const meta = {
  title: "Admin/ActivityLogsSection",
  component: ActivityLogsSection,
} satisfies Meta<typeof ActivityLogsSection>
export default meta
type Story = StoryObj<typeof meta>

/** Async server component: data comes from the mocked queries in .storybook/mocks.ts. */
export const Default: Story = {}
