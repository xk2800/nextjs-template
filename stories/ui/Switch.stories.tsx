import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Label } from "../../components/ui/label"
import { Switch } from "../../components/ui/switch"

const meta = {
  title: "UI/Switch",
  component: Switch,
} satisfies Meta<typeof Switch>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const On: Story = { args: { defaultChecked: true } }
export const Disabled: Story = { args: { disabled: true } }
export const WithLabel: Story = {
  render: (args) => <div className="flex items-center gap-2"><Switch id="mode" {...args} /><Label htmlFor="mode">Maintenance mode</Label></div>,
}
