import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Textarea } from "../../components/ui/textarea"

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  args: { placeholder: "Write something…", className: "max-w-sm" },
} satisfies Meta<typeof Textarea>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true } }
