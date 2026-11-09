import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { DatePickerWithPresets } from "../../components/ui/date-picker-with-presets"

/** Date picker with quick presets (Today, Yesterday, month/year starts). Needs `react-day-picker` and `date-fns`. */
const meta = {
  title: "UI/DatePickerWithPresets",
  component: DatePickerWithPresets,
  args: { className: "w-64" },
} satisfies Meta<typeof DatePickerWithPresets>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function Render(args) {
    const [date, setDate] = React.useState<Date | undefined>()
    return (
      <div className="pb-96">
        <DatePickerWithPresets {...args} date={date} onDateChange={setDate} />
      </div>
    )
  },
}
/** `disableFutureDates` hides future presets and blocks future days, e.g. for an expense date. */
export const NoFutureDates: Story = { ...Default, args: { disableFutureDates: true } }
