import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { EmailPreview } from "../_shared"
import { EmailTemplatePasskeyChange } from "../../components/email/email-template-passkey-change"

const meta = {
  title: "Email/PasskeyChange",
  component: EmailTemplatePasskeyChange,
  args: { firstName: "Ada", device: "Chrome on macOS · Desktop", location: "London, United Kingdom", ipAddress: "81.2.69.160", when: "Oct 17, 2026, 10:42 AM", manageUrl: "http://localhost:3000/dashboard", action: "added" },
  render: (args) => <EmailPreview email={<EmailTemplatePasskeyChange {...args} />} />,
} satisfies Meta<typeof EmailTemplatePasskeyChange>
export default meta
type Story = StoryObj<typeof meta>

export const Added: Story = {}
export const Removed: Story = { args: { action: "removed" } }
