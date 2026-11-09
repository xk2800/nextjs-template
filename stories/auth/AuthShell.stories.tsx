import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AuthCard from "../../components/auth/authCard"
import { AuthShell } from "../../components/auth/authShell"
import { ownFrame } from "../_shared"

const meta = {
  title: "Auth/AuthShell",
  component: AuthShell,
  parameters: { session: null, layout: "fullscreen", ...ownFrame(720) },
  args: {
    headline: "Ship your next app faster",
    bullets: ["Email + password, Google and passkeys", "Two-factor authentication", "Admin dashboard and audit log"],
    children: <AuthCard authCardTitle="Welcome back" authCardDescription="Sign in to your account" authCardAction="Sign in" showSocials showEmailPassword />,
  },
} satisfies Meta<typeof AuthShell>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
