import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Disclaimer } from "../../components/ui/disclaimer"

const meta = {
  title: "UI/Disclaimer",
  component: Disclaimer,
  args: { disclaimerText: "*All custom categories will only be visible to you." },
} satisfies Meta<typeof Disclaimer>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
