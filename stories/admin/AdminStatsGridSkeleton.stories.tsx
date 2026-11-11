import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AdminStatsGridSkeleton from "../../components/dashboard/admin/home/skeletons/admin-stats-skeleton"

const meta = {
  title: "Admin/AdminStatsGridSkeleton",
  component: AdminStatsGridSkeleton,
} satisfies Meta<typeof AdminStatsGridSkeleton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
