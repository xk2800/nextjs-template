import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { MonthSelector, type MonthFilter } from "../../components/ui/month-selector"

/**
 * Month filter: quick presets, "All Time" (`null`) and the last 24 months.
 * `undefined` shows the placeholder. Needs the optional peer dependencies `cmdk` and `date-fns`.
 */
const meta = {
  title: "UI/MonthSelector",
  component: MonthSelector,
  args: { onMonthChange: () => {}, className: "w-64" },
} satisfies Meta<typeof MonthSelector>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function Render(args) {
    const [value, setValue] = React.useState<MonthFilter | null | undefined>(undefined)
    return (
      <div className="pb-96">
        <MonthSelector {...args} value={value} onMonthChange={setValue} />
      </div>
    )
  },
}
export const AllTime: Story = { args: { value: null } }
