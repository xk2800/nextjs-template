import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { InfoTooltip } from "../../components/ui/info-tooltip"

/** ⓘ icon that opens a popover on click (works on touch screens, unlike a hover tooltip). */
const meta = {
  title: "UI/InfoTooltip",
  component: InfoTooltip,
  args: {
    title: "Debt service ratio",
    children: "How much of your monthly income goes to paying debts. Banks usually want this under 60%.",
  },
} satisfies Meta<typeof InfoTooltip>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <p className="flex items-center gap-1 pt-40 text-sm">
      DSR <InfoTooltip {...args} />
    </p>
  ),
}
