import { Suspense } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import SectionErrorFallback from "@/components/dashboard/sectionErrorFallback"
import UsersSection from "@/components/dashboard/admin/usersSection"
import AdminUsersSkeleton from "@/components/dashboard/admin/adminUsersSkeleton"

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage users, view activity, and control access
        </p>
      </div>

      <ErrorBoundary fallback={<SectionErrorFallback title="Users List" />}>
        <Suspense fallback={<AdminUsersSkeleton />}>
          <UsersSection />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
