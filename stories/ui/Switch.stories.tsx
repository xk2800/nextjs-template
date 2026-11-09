import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Label } from "../../components/ui/label"
import { Switch } from "../../components/ui/switch"

const SIZES = ["sm", "default", "md", "lg", "xl", "2xl"] as const

const meta = {
  title: "UI/Switch",
  component: Switch,
  argTypes: { size: { control: "select", options: SIZES } },
} satisfies Meta<typeof Switch>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const On: Story = { args: { defaultChecked: true } }
export const Disabled: Story = { args: { disabled: true } }
export const WithLabel: Story = {
  render: (args) => <div className="flex items-center gap-2"><Switch id="mode" {...args} /><Label htmlFor="mode">Maintenance mode</Label></div>,
}
/** Every `size`, off and on. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {SIZES.map((size) => (
        <div key={size} className="flex items-center gap-3">
          <Switch {...args} size={size} />
          <Switch {...args} size={size} defaultChecked />
          <code className="text-muted-foreground text-xs">{size}</code>
        </div>
      ))}
    </div>
  ),
}
