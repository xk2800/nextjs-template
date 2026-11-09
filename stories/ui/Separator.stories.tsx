import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Separator } from "../../components/ui/separator"

const meta = {
  title: "UI/Separator",
  component: Separator,
} satisfies Meta<typeof Separator>
export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: (args) => <div className="max-w-sm space-y-3"><p>Above</p><Separator {...args} /><p>Below</p></div>,
}
export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => <div className="flex h-5 items-center gap-3"><span>Left</span><Separator {...args} /><span>Right</span></div>,
}
