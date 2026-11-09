import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import DeviceThrottleTable from "../../components/dashboard/admin/deviceThrottleTable"
import { mockThrottleRows } from "../../.storybook/mocks"

const meta = {
  title: "Admin/DeviceThrottleTable",
  component: DeviceThrottleTable,
  args: { rows: mockThrottleRows },
} satisfies Meta<typeof DeviceThrottleTable>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
