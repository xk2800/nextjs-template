import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Home, Settings } from "lucide-react"
import { ownFrame } from "../_shared"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "../../components/ui/sidebar"

const meta = {
  title: "UI/Sidebar",
  component: Sidebar,
  parameters: { layout: "fullscreen", ...ownFrame(400) },
  render: (args) => (
    <SidebarProvider>
      <Sidebar {...args}>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton isActive><Home />Home</SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton><Settings />Settings</SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="p-4"><SidebarTrigger /></SidebarInset>
    </SidebarProvider>
  ),
} satisfies Meta<typeof Sidebar>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Floating: Story = { args: { variant: "floating" } }
export const Inset: Story = { args: { variant: "inset" } }
export const IconCollapsible: Story = { args: { collapsible: "icon" } }
export const Right: Story = { args: { side: "right" } }
