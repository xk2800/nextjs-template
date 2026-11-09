import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Bell, Plus } from "lucide-react"
import { Button } from "../../components/ui/button"

const meta = {
  title: "UI/Button",
  component: Button,
  args: { children: "Button" },
  argTypes: {
    variant: { control: "select", options: ["default", "secondary", "outline", "ghost", "link", "destructive"] },
    size: { control: "select", options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"] },
  },
} satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Secondary: Story = { args: { variant: "secondary" } }
export const Outline: Story = { args: { variant: "outline" } }
export const Ghost: Story = { args: { variant: "ghost" } }
export const Link: Story = { args: { variant: "link" } }
export const Destructive: Story = { args: { variant: "destructive" } }
export const Small: Story = { args: { size: "sm" } }
export const Large: Story = { args: { size: "lg" } }
export const WithIcon: Story = { args: { children: <><Plus />Add item</> } }
export const IconOnly: Story = { args: { size: "icon", variant: "outline", "aria-label": "Notifications", children: <Bell /> } }
export const Disabled: Story = { args: { disabled: true } }
