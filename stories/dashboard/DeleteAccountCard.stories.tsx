import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import DeleteAccountCard from "../../components/dashboard/deleteAccountCard"

const meta = {
  title: "Dashboard/DeleteAccountCard",
  component: DeleteAccountCard,
} satisfies Meta<typeof DeleteAccountCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
