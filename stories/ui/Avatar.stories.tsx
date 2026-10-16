import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"

const meta = {
  title: "UI/Avatar",
  component: Avatar,
} satisfies Meta<typeof Avatar>
export default meta
type Story = StoryObj<typeof meta>

export const WithImage: Story = {
  render: (args) => <Avatar {...args}><AvatarImage src="https://github.com/shadcn.png" alt="" /><AvatarFallback>CN</AvatarFallback></Avatar>,
}
export const Fallback: Story = { render: (args) => <Avatar {...args}><AvatarFallback>AL</AvatarFallback></Avatar> }
export const Large: Story = { args: { className: "size-16" }, render: Fallback.render }
