import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "../../components/ui/button"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "../../components/ui/drawer"

const meta = {
  title: "UI/Drawer",
  component: Drawer,
} satisfies Meta<typeof Drawer>
export default meta
type Story = StoryObj<typeof meta>

export const Bottom: Story = {
  render: (args) => (
    <Drawer {...args}>
      <DrawerTrigger asChild><Button>Open drawer</Button></DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Swipe down or tap outside to dismiss.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button>Apply</Button>
          <DrawerClose asChild><Button variant="outline">Cancel</Button></DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}

export const Right: Story = {
  render: () => (
    <Drawer direction="right">
      <DrawerTrigger asChild><Button>Open right</Button></DrawerTrigger>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>Side panel</DrawerTitle></DrawerHeader>
      </DrawerContent>
    </Drawer>
  ),
}
