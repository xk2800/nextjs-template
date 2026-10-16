import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import SectionErrorFallback from "../../components/dashboard/sectionErrorFallback"

const meta = {
  title: "Dashboard/SectionErrorFallback",
  component: SectionErrorFallback,
  args: { title: "Active Sessions" },
} satisfies Meta<typeof SectionErrorFallback>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
