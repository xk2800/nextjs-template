import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Calendar } from "../../components/ui/calendar"

/** Date grid (react-day-picker). Needs the optional peer dependency `react-day-picker`. */
const meta = {
  title: "UI/Calendar",
  component: Calendar,
  args: { mode: "single", selected: new Date(2026, 9, 15), defaultMonth: new Date(2026, 9, 1), className: "rounded-md border w-fit" },
} satisfies Meta<typeof Calendar>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
/** `captionLayout="dropdown"` adds month/year dropdowns. */
export const DropdownCaption: Story = { args: { captionLayout: "dropdown" } }
export const Range: Story = {
  args: {
    mode: "range",
    selected: { from: new Date(2026, 9, 6), to: new Date(2026, 9, 12) },
    numberOfMonths: 2,
  },
}
