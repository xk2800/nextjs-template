import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import DeviceThrottleTable from "../../components/dashboard/admin/home/device-throttle-table"
import { mockThrottleRows } from "../../.storybook/mocks"

const meta = {
  title: "Admin/DeviceThrottleTable",
  component: DeviceThrottleTable,
  args: { rows: mockThrottleRows },
} satisfies Meta<typeof DeviceThrottleTable>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
