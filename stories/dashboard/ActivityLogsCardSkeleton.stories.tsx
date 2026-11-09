import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import ActivityLogsCardSkeleton from "../../components/dashboard/activityLogsCardSkeleton"

const meta = {
  title: "Dashboard/ActivityLogsCardSkeleton",
  component: ActivityLogsCardSkeleton,
} satisfies Meta<typeof ActivityLogsCardSkeleton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
