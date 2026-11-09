import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { narrow } from "../_shared"
import ResetPasswordForm from "../../components/auth/resetPasswordForm"

const meta = {
  title: "Auth/ResetPasswordForm",
  component: ResetPasswordForm,
  parameters: { session: null },
  decorators: [narrow],
  args: { token: "demo-token" },
} satisfies Meta<typeof ResetPasswordForm>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
