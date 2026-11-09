import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { narrow } from "../_shared"
import PasskeyLogin from "../../components/auth/passkeyLogin"

const meta = {
  title: "Auth/PasskeyLogin",
  component: PasskeyLogin,
  parameters: { session: null },
  decorators: [narrow],
} satisfies Meta<typeof PasskeyLogin>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
