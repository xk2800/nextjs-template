import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import PasskeysCard from "../../components/dashboard/passkeysCard"

const meta = {
  title: "Dashboard/PasskeysCard",
  component: PasskeysCard,
} satisfies Meta<typeof PasskeysCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
