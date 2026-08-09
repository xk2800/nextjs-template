import { getUsersFiltered } from "@/lib/user-queries"
import AdminUsersTable from "@/components/dashboard/admin/adminUsersTable"

export default async function UsersSection() {
  const { users, total, page, limit, pages } = await getUsersFiltered({ page: 1, limit: 10 })

  return (
    <AdminUsersTable
      initialUsers={users}
      initialPagination={{ page, limit, total, pages }}
    />
  )
}
