import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { narrow } from "../_shared"
import TwoFactorVerifyForm from "../../components/auth/mfa/two-factor-verify-form"

const meta = {
  title: "Auth/TwoFactorVerifyForm",
  component: TwoFactorVerifyForm,
  parameters: { session: null },
  decorators: [narrow],
  args: { callbackUrl: "/dashboard" },
} satisfies Meta<typeof TwoFactorVerifyForm>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
