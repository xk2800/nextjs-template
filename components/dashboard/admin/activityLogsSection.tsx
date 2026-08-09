import { getActivityLogsFiltered } from "@xk2800/nextjs-template/activity/queries"
import AdminActivityLogsTable from "./adminActivityLogsTable"

export default async function ActivityLogsSection() {
  const { logs, total, page, limit, pages } = await getActivityLogsFiltered({ page: 1, limit: 20 })

  return (
    <AdminActivityLogsTable
      initialLogs={logs}
      initialPagination={{ page, limit, total, pages }}
    />
  )
}
