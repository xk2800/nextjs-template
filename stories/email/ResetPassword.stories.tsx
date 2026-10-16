import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { EmailPreview } from "../_shared"
import { EmailTemplateResetPassword } from "../../components/email/email-template-reset-password"

const meta = {
  title: "Email/ResetPassword",
  component: EmailTemplateResetPassword,
  args: { firstName: "Ada", url: "http://localhost:3000/reset-password?token=demo" },
  render: (args) => <EmailPreview email={<EmailTemplateResetPassword {...args} />} />,
} satisfies Meta<typeof EmailTemplateResetPassword>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
