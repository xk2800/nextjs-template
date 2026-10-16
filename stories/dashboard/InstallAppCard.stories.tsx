import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import InstallAppCard from "../../components/dashboard/installAppCard"

const meta = {
  title: "Dashboard/InstallAppCard",
  component: InstallAppCard,
} satisfies Meta<typeof InstallAppCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
