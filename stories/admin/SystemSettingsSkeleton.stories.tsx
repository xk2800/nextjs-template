import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import SystemSettingsSkeleton from "../../components/dashboard/admin/systemSettingsSkeleton"

const meta = {
  title: "Admin/SystemSettingsSkeleton",
  component: SystemSettingsSkeleton,
} satisfies Meta<typeof SystemSettingsSkeleton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
