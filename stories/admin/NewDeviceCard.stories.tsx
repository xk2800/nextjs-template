import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import NewDeviceCard from "../../components/dashboard/admin/newDeviceCard"

const meta = {
  title: "Admin/NewDeviceCard",
  component: NewDeviceCard,
} satisfies Meta<typeof NewDeviceCard>
export default meta
type Story = StoryObj<typeof meta>

/** Async server component: data comes from the mocked queries in .storybook/mocks.ts. */
export const Default: Story = {}
