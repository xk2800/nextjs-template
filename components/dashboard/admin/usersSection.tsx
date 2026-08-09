import { getUsersFiltered } from "@xk2800/nextjs-template/users/queries"
import AdminUsersTable from "./adminUsersTable"

export default async function UsersSection() {
  const { users, total, page, limit, pages } = await getUsersFiltered({ page: 1, limit: 10 })

  return (
    <AdminUsersTable
      initialUsers={users}
      initialPagination={{ page, limit, total, pages }}
    />
  )
}
