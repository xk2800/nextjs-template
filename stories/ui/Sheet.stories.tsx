import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "../../components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet"

const meta = {
  title: "UI/Sheet",
  component: Sheet,
} satisfies Meta<typeof Sheet>
export default meta
type Story = StoryObj<typeof meta>

const sheet = (side: "top" | "right" | "bottom" | "left"): Story => ({
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger asChild><Button variant="outline">Open {side} sheet</Button></SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Sheet title</SheetTitle>
          <SheetDescription>Side panel content.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
})
export const Right = sheet("right")
export const Left = sheet("left")
export const Top = sheet("top")
export const Bottom = sheet("bottom")
