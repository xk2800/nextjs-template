import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import DeleteAccountCard from "../../components/dashboard/settings/delete-account-card"

const meta = {
  title: "Dashboard/DeleteAccountCard",
  component: DeleteAccountCard,
} satisfies Meta<typeof DeleteAccountCard>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
/** `disabledReason` disables (dims) the button; hover or focus it to see why. */
export const Disabled: Story = { args: { disabledReason: "You have an active subscription. Cancel it in Settings before deleting your account." } }
