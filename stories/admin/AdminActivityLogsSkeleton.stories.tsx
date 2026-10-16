import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AdminActivityLogsSkeleton from "../../components/dashboard/admin/adminActivityLogsSkeleton"

const meta = {
  title: "Admin/AdminActivityLogsSkeleton",
  component: AdminActivityLogsSkeleton,
} satisfies Meta<typeof AdminActivityLogsSkeleton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
