import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import NewDeviceTable from "../../components/dashboard/admin/newDeviceTable"
import { mockNewDevices } from "../../.storybook/mocks"

const meta = {
  title: "Admin/NewDeviceTable",
  component: NewDeviceTable,
  args: { rows: mockNewDevices },
} satisfies Meta<typeof NewDeviceTable>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
