import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import AdminUsersTable from "../../components/dashboard/admin/adminUsersTable"
import { mockUsers } from "../../.storybook/mocks"

const meta = {
  title: "Admin/AdminUsersTable",
  component: AdminUsersTable,
  args: { initialUsers: mockUsers, initialPagination: { page: 1, limit: 10, total: mockUsers.length, pages: 1 } },
} satisfies Meta<typeof AdminUsersTable>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const MultiplePages: Story = { args: { initialPagination: { page: 1, limit: 10, total: 87, pages: 9 } } }
export const Empty: Story = { args: { initialUsers: [], initialPagination: { page: 1, limit: 10, total: 0, pages: 0 } } }
