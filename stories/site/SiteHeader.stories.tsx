import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SiteHeader } from "../../components/site/site-header"

const meta = {
  title: "Site/SiteHeader",
  component: SiteHeader,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteHeader>
export default meta
type Story = StoryObj<typeof meta>

/** Async server component: reads the (mocked) session to pick the CTA. */
export const SignedOut: Story = { parameters: { session: null } }
export const SignedIn: Story = {}
export const ActiveFeatures: Story = { args: { active: "features" } }
export const ActiveChangelog: Story = { args: { active: "changelog" } }
