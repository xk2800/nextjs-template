import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ThemeToggle } from "../../components/theme/theme-toggle"

const meta = {
  title: "Site/ThemeToggle",
  component: ThemeToggle,
} satisfies Meta<typeof ThemeToggle>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
