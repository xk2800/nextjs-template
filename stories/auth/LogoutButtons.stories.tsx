import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import LogoutButtons from "../../components/auth/session/logout-buttons"

const meta = {
  title: "Auth/LogoutButtons",
  component: LogoutButtons,
} satisfies Meta<typeof LogoutButtons>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
