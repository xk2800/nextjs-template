import { getAdminStats } from "@/lib/admin-queries"
import AdminSection from "@/components/dashboard/adminSection"

export default async function AdminStatsSection() {
  const stats = await getAdminStats()

  return <AdminSection stats={stats} />
}
