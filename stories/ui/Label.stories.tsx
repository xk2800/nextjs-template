import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

const meta = {
  title: "UI/Label",
  component: Label,
  args: { children: "Email" },
} satisfies Meta<typeof Label>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithInput: Story = {
  render: (args) => <div className="grid max-w-sm gap-2"><Label htmlFor="email" {...args} /><Input id="email" /></div>,
}
