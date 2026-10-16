import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import ImpersonationBanner from "../../components/dashboard/impersonationBanner"
import { mockSessions, mockUser } from "../../.storybook/mocks"

const meta = {
  title: "Dashboard/ImpersonationBanner",
  component: ImpersonationBanner,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ImpersonationBanner>
export default meta
type Story = StoryObj<typeof meta>

export const Impersonating: Story = {
  parameters: { session: { user: mockUser, session: { ...mockSessions[0], impersonatedBy: "usr_admin" } } },
}
/** Renders nothing outside an impersonation session. */
export const NotImpersonating: Story = {}
