import { getAdminStats } from "@xk2800/nextjs-template/admin/queries"
import AdminSection from "./adminSection"

export default async function AdminStatsSection() {
  const stats = await getAdminStats()

  return <AdminSection stats={stats} />
}
