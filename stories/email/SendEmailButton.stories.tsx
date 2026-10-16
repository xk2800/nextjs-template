import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SendEmailButton } from "../../components/email/send-email-button"

const meta = {
  title: "Email/SendEmailButton",
  component: SendEmailButton,
} satisfies Meta<typeof SendEmailButton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
