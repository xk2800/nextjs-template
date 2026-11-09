import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ChangelogView, type ChangelogEntry } from "../../components/changelog/changelog-view"
import changelog from "../../data/changelog.json"

const meta = {
  title: "Site/ChangelogView",
  component: ChangelogView,
  parameters: { layout: "fullscreen", session: null },
  args: { active: "changelog", entries: (changelog as ChangelogEntry[]).slice(0, 5) },
} satisfies Meta<typeof ChangelogView>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Empty: Story = { args: { entries: [] } }
