import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SourceSelector } from "../../components/ui/source-selector"

const sources = [
  { id: 1, name: "Salary" },
  { id: 2, name: "Freelance" },
]

/**
 * Like `CategorySelector`, but the value is the source's name and picking a suggestion selects
 * that name directly. Pass the sources in; fetching is up to the app. Needs the optional peer dependency `cmdk`.
 */
const meta = {
  title: "UI/SourceSelector",
  component: SourceSelector,
  args: { sources, className: "w-72" },
} satisfies Meta<typeof SourceSelector>
export default meta
type Story = StoryObj<typeof meta>

function Stateful(args: React.ComponentProps<typeof SourceSelector>) {
  const [value, setValue] = React.useState("")
  const [newName, setNewName] = React.useState("")
  return (
    <div className="pb-72">
      <SourceSelector {...args} value={value} onSourceChange={setValue} newSourceValue={newName} onNewSourceChange={setNewName} />
    </div>
  )
}

export const Default: Story = { render: Stateful }
export const WithSuggestions: Story = {
  render: Stateful,
  args: {
    newSourceNote: "*All custom sources will only be visible to you.",
    suggestionGroups: [{ heading: "Suggested", items: [{ name: "Rental income", note: "Taxable under section 4(d)" }] }],
  },
}
