import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { narrow } from "../_shared"
import SocialLogin from "../../components/auth/socialLogin"

const meta = {
  title: "Auth/SocialLogin",
  component: SocialLogin,
  parameters: { session: null },
  decorators: [narrow],
} satisfies Meta<typeof SocialLogin>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const CustomLabel: Story = { args: { label: "Continue with Google" } }
