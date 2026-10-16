import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import UsersSection from "../../components/dashboard/admin/usersSection"

const meta = {
  title: "Admin/UsersSection",
  component: UsersSection,
} satisfies Meta<typeof UsersSection>
export default meta
type Story = StoryObj<typeof meta>

/** Async server component: data comes from the mocked queries in .storybook/mocks.ts. */
export const Default: Story = {}
