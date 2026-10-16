import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import SystemSettingsSection from "../../components/dashboard/admin/systemSettingsSection"

const meta = {
  title: "Admin/SystemSettingsSection",
  component: SystemSettingsSection,
} satisfies Meta<typeof SystemSettingsSection>
export default meta
type Story = StoryObj<typeof meta>

/** Async server component: data comes from the mocked queries in .storybook/mocks.ts. */
export const Default: Story = {}
