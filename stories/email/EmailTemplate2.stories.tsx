import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { EmailPreview } from "../_shared"
import { EmailTemplate2 } from "../../components/email/email-template-2"

const meta = {
  title: "Email/EmailTemplate2",
  component: EmailTemplate2,
  args: { firstName: "Ada" },
  render: (args) => <EmailPreview email={<EmailTemplate2 {...args} />} />,
} satisfies Meta<typeof EmailTemplate2>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
