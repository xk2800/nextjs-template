import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { narrow } from "../_shared"
import AuthCard from "../../components/auth/authCard"

const meta = {
  title: "Auth/AuthCard",
  component: AuthCard,
  parameters: { session: null },
  decorators: [narrow],
  args: { authCardTitle: "Welcome back", authCardDescription: "Sign in to your account", authCardAction: "Sign in", showSocials: true, showEmailPassword: true },
} satisfies Meta<typeof AuthCard>
export default meta
type Story = StoryObj<typeof meta>

export const Login: Story = {}
export const Signup: Story = { args: { variant: "signup", authCardTitle: "Create an account", authCardDescription: "Get started in seconds", authCardAction: "Sign up" } }
export const SocialOnly: Story = { args: { showEmailPassword: false } }
export const EmailOnly: Story = { args: { showSocials: false } }
export const WithCallbackUrl: Story = { args: { callbackUrl: "/dashboard/settings" } }
