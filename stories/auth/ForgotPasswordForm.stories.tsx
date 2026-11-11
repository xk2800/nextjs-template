import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { narrow } from "../_shared"
import ForgotPasswordForm from "../../components/auth/recovery/forgot-password-form"

const meta = {
  title: "Auth/ForgotPasswordForm",
  component: ForgotPasswordForm,
  parameters: { session: null },
  decorators: [narrow],
} satisfies Meta<typeof ForgotPasswordForm>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
