import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { EmailPreview } from "../_shared"
import { EmailTemplateVerifyEmail } from "../../components/email/email-template-verify-email"

const meta = {
  title: "Email/VerifyEmail",
  component: EmailTemplateVerifyEmail,
  args: { firstName: "Ada", url: "http://localhost:3000/verify?token=demo" },
  render: (args) => <EmailPreview email={<EmailTemplateVerifyEmail {...args} />} />,
} satisfies Meta<typeof EmailTemplateVerifyEmail>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
