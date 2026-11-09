import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import ImpersonationLogCard from "../../components/dashboard/admin/impersonationLogCard"

const meta = {
  title: "Admin/ImpersonationLogCard",
  component: ImpersonationLogCard,
} satisfies Meta<typeof ImpersonationLogCard>
export default meta
type Story = StoryObj<typeof meta>

/** Async server component: data comes from the mocked queries in .storybook/mocks.ts. */
export const Default: Story = {}
export const WithoutViewAllLink: Story = { args: { showViewAllLink: false } }
