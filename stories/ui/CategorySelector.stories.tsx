import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { CategorySelector } from "../../components/ui/category-selector"

const categories = [
  { id: 1, name: "Groceries", color: "#16a34a" },
  { id: 2, name: "Transport", color: "#2563eb" },
  { id: 3, name: "Dining out", color: null },
]

/**
 * Combobox over the user's categories (pass them in; fetching is up to the app).
 * "Add new category" reveals a name input; `suggestionGroups` offer extra names that select
 * a matching category or pre-fill the new one. Needs the optional peer dependency `cmdk`.
 */
const meta = {
  title: "UI/CategorySelector",
  component: CategorySelector<number>,
  args: { categories, className: "w-72" },
} satisfies Meta<typeof CategorySelector<number>>
export default meta
type Story = StoryObj<typeof meta>

function Stateful(args: React.ComponentProps<typeof CategorySelector<number>>) {
  const [value, setValue] = React.useState<number | null>(null)
  const [newName, setNewName] = React.useState("")
  return (
    <div className="pb-80">
      <CategorySelector {...args} value={value} onCategoryChange={setValue} newCategoryValue={newName} onNewCategoryChange={setNewName} />
    </div>
  )
}

export const Default: Story = { render: Stateful }
export const Loading: Story = { args: { isLoading: true } }
export const WithSuggestions: Story = {
  render: Stateful,
  args: {
    newCategoryNote: "*All custom categories will only be visible to you.",
    suggestionGroups: [
      { heading: "Budget Buckets", items: [{ name: "Groceries" }, { name: "Travel" }] },
      { heading: "Tax Relief Categories", items: [{ name: "Medical", note: "Up to RM10,000 a year" }] },
    ],
  },
}
