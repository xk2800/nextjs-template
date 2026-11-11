import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import SharedDeviceTable from "../../components/dashboard/admin/home/shared-device-table"
import { mockSharedDevices } from "../../.storybook/mocks"

const meta = {
  title: "Admin/SharedDeviceTable",
  component: SharedDeviceTable,
  args: { devices: mockSharedDevices },
} satisfies Meta<typeof SharedDeviceTable>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
