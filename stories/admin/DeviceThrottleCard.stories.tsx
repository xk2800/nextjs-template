import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import DeviceThrottleCard from "../../components/dashboard/admin/deviceThrottleCard"

const meta = {
  title: "Admin/DeviceThrottleCard",
  component: DeviceThrottleCard,
} satisfies Meta<typeof DeviceThrottleCard>
export default meta
type Story = StoryObj<typeof meta>

/** Async server component: data comes from the mocked queries in .storybook/mocks.ts. */
export const Default: Story = {}
export const WithoutHistoryLink: Story = { args: { showHistoryLink: false } }
