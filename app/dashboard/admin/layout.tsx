import { requireRole } from "@/lib/auth-helpers"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This will redirect to /dashboard if user is not admin
  await requireRole('admin')

  return <>{children}</>
}
