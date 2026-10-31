import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../../components/ui/chart"

const data = [
  { month: "Jan", income: 4200, expenses: 3100 },
  { month: "Feb", income: 4300, expenses: 2900 },
  { month: "Mar", income: 4100, expenses: 3500 },
  { month: "Apr", income: 4600, expenses: 3200 },
]

const config = {
  income: { label: "Income", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-2)" },
} satisfies ChartConfig

/** Recharts wrapper: `config` maps each series to a label and colour (`var(--color-<key>)`). Needs the optional peer dependency `recharts`. */
const meta = {
  title: "UI/Chart",
  component: ChartContainer,
  args: { config, className: "h-64 w-full max-w-xl", children: <></> },
} satisfies Meta<typeof ChartContainer>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <ChartContainer {...args}>
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
}
