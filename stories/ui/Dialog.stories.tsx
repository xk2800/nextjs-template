import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"

const meta = {
  title: "UI/Dialog",
  component: Dialog,
} satisfies Meta<typeof Dialog>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Make changes and save when you're done.</DialogDescription>
        </DialogHeader>
        <Input defaultValue="Ada Lovelace" />
        <DialogFooter><Button>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

/**
 * A select and a popover opened from inside a dialog stay clickable: every component
 * imports Radix from the one `radix-ui` package, so they share the dialog's layer stack.
 */
export const WithNestedMenus: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New expense</DialogTitle>
          <DialogDescription>Pick from the select and the popover; both should respond.</DialogDescription>
        </DialogHeader>
        <Select>
          <SelectTrigger className="w-full"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="transport">Transport</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild><Button variant="outline">Open popover</Button></PopoverTrigger>
          <PopoverContent><Button size="sm" onClick={() => alert("Clicked inside the popover")}>Click me</Button></PopoverContent>
        </Popover>
      </DialogContent>
    </Dialog>
  ),
}
