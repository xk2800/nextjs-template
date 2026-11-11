import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import SessionsCardSkeleton from "../../components/dashboard/settings/sessions/skeletons/sessions-card-skeleton"

const meta = {
  title: "Dashboard/SessionsCardSkeleton",
  component: SessionsCardSkeleton,
} satisfies Meta<typeof SessionsCardSkeleton>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
