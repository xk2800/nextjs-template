import { getActivityLogsFiltered } from "@/lib/activity-queries"
import AdminActivityLogsTable from "@/components/dashboard/admin/adminActivityLogsTable"

export default async function ActivityLogsSection() {
  const { logs, total, page, limit, pages } = await getActivityLogsFiltered({ page: 1, limit: 20 })

  return (
    <AdminActivityLogsTable
      initialLogs={logs}
      initialPagination={{ page, limit, total, pages }}
    />
  )
}
