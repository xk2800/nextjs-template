import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AdminUsersSkeleton from "../../components/dashboard/admin/adminUsersSkeleton"

const meta = {
  title: "Admin/AdminUsersSkeleton",
  component: AdminUsersSkeleton,
} satisfies Meta<typeof AdminUsersSkeleton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
