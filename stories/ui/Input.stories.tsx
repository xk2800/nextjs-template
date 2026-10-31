import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Input } from "../../components/ui/input"

const meta = {
  title: "UI/Input",
  component: Input,
  args: { placeholder: "you@example.com", className: "max-w-sm" },
} satisfies Meta<typeof Input>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithValue: Story = { args: { defaultValue: "ada@example.com" } }
export const Invalid: Story = { args: { "aria-invalid": true } }
export const Disabled: Story = { args: { disabled: true } }
export const File: Story = { args: { type: "file" } }
/** `type="number"` hides the browser's up/down spinners and ignores the ↑/↓ keys. */
export const Number: Story = { args: { type: "number", placeholder: "0", defaultValue: 42 } }
