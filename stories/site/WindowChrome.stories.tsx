import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { WindowChrome } from "../../components/site/window-chrome"

const meta = {
  title: "Site/WindowChrome",
  component: WindowChrome,
  args: { label: "app/dashboard/page.tsx" },
  decorators: [(Story) => <div className="max-w-md rounded-lg border"><Story /><div className="p-4 text-sm text-muted-foreground">Window body</div></div>],
} satisfies Meta<typeof WindowChrome>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
