import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { fn } from "storybook/test"
import { DataTablePagination } from "../../components/ui/data-table"

const meta = {
  title: "UI/DataTablePagination",
  component: DataTablePagination,
  args: { page: 4, pages: 12, onPageChange: fn() },
} satisfies Meta<typeof DataTablePagination>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const FirstPage: Story = { args: { page: 1 } }
export const FewPages: Story = { args: { page: 2, pages: 3 } }
export const Interactive: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(args.page)
    return <DataTablePagination {...args} page={page} onPageChange={setPage} />
  },
}
