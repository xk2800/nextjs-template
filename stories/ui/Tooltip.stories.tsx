import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "../../components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  args: { defaultOpen: true },
} satisfies Meta<typeof Tooltip>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <TooltipProvider>
      <div className="py-10">
        <Tooltip {...args}>
          <TooltipTrigger asChild><Button variant="outline">Hover me</Button></TooltipTrigger>
          <TooltipContent>Tooltip content</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
}
