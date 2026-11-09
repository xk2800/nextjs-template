import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { EmailPreview } from "../_shared"
import { EmailTemplateNewDevice } from "../../components/email/email-template-new-device"

const meta = {
  title: "Email/NewDevice",
  component: EmailTemplateNewDevice,
  args: { firstName: "Ada", device: "Chrome on macOS · Desktop", location: "London, United Kingdom", ipAddress: "81.2.69.160", when: "Oct 17, 2026, 10:42 AM", manageUrl: "http://localhost:3000/dashboard" },
  render: (args) => <EmailPreview email={<EmailTemplateNewDevice {...args} />} />,
} satisfies Meta<typeof EmailTemplateNewDevice>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithoutButton: Story = { args: { manageUrl: undefined } }
