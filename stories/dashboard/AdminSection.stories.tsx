import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AdminSection from "../../components/dashboard/settings/admin-section"

const meta = {
  title: "Dashboard/AdminSection",
  component: AdminSection,
} satisfies Meta<typeof AdminSection>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
