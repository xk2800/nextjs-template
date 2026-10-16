import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog"
import { Input } from "../../components/ui/input"

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
