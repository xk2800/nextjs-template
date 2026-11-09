import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"

const meta = {
  title: "UI/Card",
  component: Card,
  args: { className: "max-w-sm" },
} satisfies Meta<typeof Card>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>Supporting description text.</CardDescription>
        <CardAction><Badge>New</Badge></CardAction>
      </CardHeader>
      <CardContent>Card body content goes here.</CardContent>
      <CardFooter className="gap-2">
        <Button size="sm">Save</Button>
        <Button size="sm" variant="outline">Cancel</Button>
      </CardFooter>
    </Card>
  ),
}
export const ContentOnly: Story = { render: (args) => <Card {...args}><CardContent>Just content.</CardContent></Card> }
