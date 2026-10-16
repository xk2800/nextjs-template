import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import VerifyEmailButton from "../../components/dashboard/verifyEmailButton"

const meta = {
  title: "Dashboard/VerifyEmailButton",
  component: VerifyEmailButton,
  args: { email: "ada@example.com" },
} satisfies Meta<typeof VerifyEmailButton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
