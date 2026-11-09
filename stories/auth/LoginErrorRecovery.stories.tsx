import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { narrow } from "../_shared"
import LoginErrorRecovery from "../../components/auth/loginErrorRecovery"

const meta = {
  title: "Auth/LoginErrorRecovery",
  component: LoginErrorRecovery,
  parameters: { session: null },
  decorators: [narrow],
  args: { error: "account_banned", callbackUrl: "/dashboard" },
} satisfies Meta<typeof LoginErrorRecovery>
export default meta
type Story = StoryObj<typeof meta>

export const AccountBanned: Story = {}
export const AccountNotLinked: Story = { args: { error: "account_not_linked" } }
export const UnknownError: Story = { args: { error: "something_went_wrong" } }
