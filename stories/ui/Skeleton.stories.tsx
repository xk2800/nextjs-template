import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Skeleton } from "../../components/ui/skeleton"

const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  args: { className: "h-4 w-48" },
} satisfies Meta<typeof Skeleton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const ProfileRow: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-4 w-32" /></div>
    </div>
  ),
}
