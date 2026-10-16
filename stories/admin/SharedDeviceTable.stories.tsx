import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import SharedDeviceTable from "../../components/dashboard/admin/sharedDeviceTable"
import { mockSharedDevices } from "../../.storybook/mocks"

const meta = {
  title: "Admin/SharedDeviceTable",
  component: SharedDeviceTable,
  args: { devices: mockSharedDevices },
} satisfies Meta<typeof SharedDeviceTable>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
