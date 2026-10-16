import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AppSidebar from "../../components/dashboard/appSidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../../components/ui/sidebar"
import { ownFrame } from "../_shared"
import { mockUser } from "../../.storybook/mocks"

const meta = {
  title: "Dashboard/AppSidebar",
  component: AppSidebar,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/dashboard" } }, ...ownFrame(600) },
  args: { user: mockUser, isAdmin: true },
  decorators: [(Story) => <SidebarProvider><Story /><SidebarInset className="p-4"><SidebarTrigger /></SidebarInset></SidebarProvider>],
} satisfies Meta<typeof AppSidebar>
export default meta
type Story = StoryObj<typeof meta>

export const Admin: Story = {}
export const Member: Story = { args: { isAdmin: false } }
export const CustomBrand: Story = { args: { brandName: "Acme Inc." } }
