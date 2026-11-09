import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SiteFooter } from "../../components/site/site-footer"

const meta = {
  title: "Site/SiteFooter",
  component: SiteFooter,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteFooter>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
