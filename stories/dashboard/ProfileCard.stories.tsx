import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import ProfileCard from "../../components/dashboard/profileCard"
import { mockUser } from "../../.storybook/mocks"

const meta = {
  title: "Dashboard/ProfileCard",
  component: ProfileCard,
  args: { user: mockUser, isAdmin: true },
} satisfies Meta<typeof ProfileCard>
export default meta
type Story = StoryObj<typeof meta>

export const Admin: Story = {}
export const Member: Story = { args: { isAdmin: false, user: { ...mockUser, role: "user" } } }
export const WithAvatar: Story = { args: { user: { ...mockUser, image: "https://github.com/shadcn.png" } } }
