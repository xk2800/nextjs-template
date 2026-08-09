import { getUserActivityLogs, getAllActivityLogs } from "@xk2800/nextjs-template/activity/queries"
import ActivityLogsCard from "./activityLogsCard"

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
