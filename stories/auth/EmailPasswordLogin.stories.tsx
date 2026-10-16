import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { narrow } from "../_shared"
import EmailPasswordLogin from "../../components/auth/emailPasswordLogin"

const meta = {
  title: "Auth/EmailPasswordLogin",
  component: EmailPasswordLogin,
  parameters: { session: null },
  decorators: [narrow],
} satisfies Meta<typeof EmailPasswordLogin>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithCallbackUrl: Story = { args: { callbackUrl: "/dashboard/settings" } }
