import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AdminActivityLogsSkeleton from "../../components/dashboard/admin/activity-logs/skeletons/activity-logs-skeleton"

const meta = {
  title: "Admin/AdminActivityLogsSkeleton",
  component: AdminActivityLogsSkeleton,
} satisfies Meta<typeof AdminActivityLogsSkeleton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
