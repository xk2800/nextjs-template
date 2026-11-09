import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { EmailPreview } from "../_shared"
import { EmailTemplateWelcome } from "../../components/email/email-template-welcome"

const meta = {
  title: "Email/Welcome",
  component: EmailTemplateWelcome,
  args: { firstName: "Ada" },
  render: (args) => <EmailPreview email={<EmailTemplateWelcome {...args} />} />,
} satisfies Meta<typeof EmailTemplateWelcome>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
