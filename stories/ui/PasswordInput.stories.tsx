import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { PasswordInput } from "../../components/ui/password-input"

const meta = {
  title: "UI/PasswordInput",
  component: PasswordInput,
  args: { placeholder: "Password", className: "max-w-sm" },
} satisfies Meta<typeof PasswordInput>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithValue: Story = { args: { defaultValue: "hunter2" } }
export const Disabled: Story = { args: { disabled: true } }
