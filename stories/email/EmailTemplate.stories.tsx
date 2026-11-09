import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { EmailPreview } from "../_shared"
import { EmailTemplate } from "../../components/email/email-template"

const meta = {
  title: "Email/EmailTemplate",
  component: EmailTemplate,
  args: { firstName: "Ada" },
  render: (args) => <EmailPreview email={<EmailTemplate {...args} />} />,
} satisfies Meta<typeof EmailTemplate>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
