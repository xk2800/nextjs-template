import { getUserActivityLogs, getAllActivityLogs } from "@/lib/activity-queries"
import ActivityLogsCard from "@/components/dashboard/activityLogsCard"

export default async function ActivityLogsSection({
  userId,
  isAdmin,
}: {
  userId: string
  isAdmin: boolean
}) {
  const logs = isAdmin
    ? await getAllActivityLogs(20, 0)
    : await getUserActivityLogs(userId, 20)

  return <ActivityLogsCard initialLogs={logs} isAdmin={isAdmin} />
}
