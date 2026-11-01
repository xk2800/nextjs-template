import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Badge } from "../../components/ui/badge"
import AdminUsersTable, { type AdminUser } from "../../components/dashboard/admin/adminUsersTable"
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

// An app with subscriptions and per-user storage: rows carry extra fields.
type AppUser = AdminUser & { trialEndsAt?: Date | null; storage: "db" | "drive" }
const appUsers: AppUser[] = mockUsers.map((u, i) => ({
  ...u,
  plan: ["trial", "active", "early_bird", "trial"][i],
  trialEndsAt: i === 0 ? new Date(Date.now() + 12 * 864e5) : null,
  storage: i === 1 ? "drive" : "db",
}))

/**
 * `plans` adds a Plan column with a change-plan picker (`PATCH /api/admin/users/:id` `{ plan }`);
 * `note` adds text under it. Only pass it if your app has plans/subscriptions.
 */
export const WithPlans: Story = {
  args: {
    initialUsers: appUsers,
    plans: {
      options: [
        { value: "trial", label: "Free Trial" },
        { value: "active", label: "Member" },
        { value: "early_bird", label: "Early Bird" },
      ],
      note: (u) => {
        const ends = (u as AppUser).trialEndsAt
        return u.plan === "trial" && ends ? `until ${ends.toLocaleDateString()}` : null
      },
    },
  },
}

/** `extraColumns` adds app-specific columns before Status, e.g. where a user's data is stored. */
export const WithExtraColumns: Story = {
  args: {
    initialUsers: appUsers,
    extraColumns: [{
      name: "storage",
      title: "Storage",
      renderer: (u) => <Badge variant="outline">{(u as AppUser).storage === "drive" ? "Drive" : "DB"}</Badge>,
    }],
  },
}

/** `impersonation={false}` hides the Impersonate action (for apps that turn it off in createAuth). */
export const WithoutImpersonation: Story = { args: { impersonation: false } }

/** `userHref` sets where names link; return null for plain text (an app without a user detail page). */
export const WithoutUserLinks: Story = { args: { userHref: () => null } }
