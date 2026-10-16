import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import DashboardHeader from "../../components/dashboard/dashboardHeader"
import { ThemeToggle } from "../../components/theme/theme-toggle"

const meta = {
  title: "Dashboard/DashboardHeader",
  component: DashboardHeader,
  parameters: { layout: "fullscreen" },
  args: { userName: "Ada Lovelace", actions: <ThemeToggle /> },
} satisfies Meta<typeof DashboardHeader>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const SignedOut: Story = { args: { userName: undefined, actions: undefined } }
export const CustomBrandAndNav: Story = {
  args: {
    brandName: <span className="font-black tracking-tight">Acme</span>,
    navLinks: [{ href: "/dashboard", label: "Overview", active: true }, { href: "/billing", label: "Billing" }],
  },
}
