import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { mockUsers } from "../../.storybook/mocks"

const meta = {
  title: "UI/Table",
  component: Table,
} satisfies Meta<typeof Table>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Table {...args}>
      <TableCaption>Recent users</TableCaption>
      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
      <TableBody>
        {mockUsers.map((u) => (
          <TableRow key={u.id}><TableCell>{u.name ?? "—"}</TableCell><TableCell>{u.email}</TableCell><TableCell>{u.role}</TableCell></TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}
