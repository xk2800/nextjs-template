import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { narrow } from "../_shared"
import EmailPasswordSignup from "../../components/auth/emailPasswordSignup"

const meta = {
  title: "Auth/EmailPasswordSignup",
  component: EmailPasswordSignup,
  parameters: { session: null },
  decorators: [narrow],
} satisfies Meta<typeof EmailPasswordSignup>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
