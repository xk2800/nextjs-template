import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { fn } from "storybook/test"
import changelog from "../../data/changelog.json"
import { UpdateModal } from "../../components/Updates/UpdateModal"
import { ownFrame } from "../_shared"

const meta = {
  title: "Site/UpdateModal",
  component: UpdateModal,
  parameters: { ...ownFrame(600) },
  args: { isOpen: true, onClose: fn() },
} satisfies Meta<typeof UpdateModal>
export default meta
type Story = StoryObj<typeof meta>

export const Latest: Story = {}
export const SpecificVersion: Story = { args: { version: changelog[1]?.version } }
