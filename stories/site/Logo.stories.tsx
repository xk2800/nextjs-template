import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Logo } from "../../components/site/logo"

const meta = {
  title: "Site/Logo",
  component: Logo,
} satisfies Meta<typeof Logo>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
