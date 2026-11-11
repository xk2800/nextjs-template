import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { EmailPreview } from "../_shared"
import { EmailTemplateBanned } from "../../components/email/security/account-banned"

/** Sent to the user when an admin bans them (single or bulk), if RESEND_API_KEY is set. */
const meta = {
  title: "Email/Banned",
  component: EmailTemplateBanned,
  args: { firstName: "Alan", appName: "Next.js Template", reason: "Spam" },
  render: (args) => <EmailPreview email={<EmailTemplateBanned {...args} />} />,
} satisfies Meta<typeof EmailTemplateBanned>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithoutReason: Story = { args: { reason: null } }
