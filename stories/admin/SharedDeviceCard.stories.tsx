import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import SharedDeviceCard from "../../components/dashboard/admin/sharedDeviceCard"

const meta = {
  title: "Admin/SharedDeviceCard",
  component: SharedDeviceCard,
} satisfies Meta<typeof SharedDeviceCard>
export default meta
type Story = StoryObj<typeof meta>

/** Async server component: data comes from the mocked queries in .storybook/mocks.ts. */
export const Default: Story = {}
