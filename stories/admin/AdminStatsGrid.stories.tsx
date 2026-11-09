import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AdminStatsGrid from "../../components/dashboard/admin/adminStatsGrid"

const meta = {
  title: "Admin/AdminStatsGrid",
  component: AdminStatsGrid,
} satisfies Meta<typeof AdminStatsGrid>
export default meta
type Story = StoryObj<typeof meta>

/** Async server component: data comes from the mocked queries in .storybook/mocks.ts. */
export const Default: Story = {}
