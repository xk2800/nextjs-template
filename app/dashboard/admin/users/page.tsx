import { Suspense } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import SectionErrorFallback from "@/components/dashboard/sectionErrorFallback"
import UsersSection from "@/components/dashboard/admin/usersSection"
import AdminUsersSkeleton from "@/components/dashboard/admin/adminUsersSkeleton"
import ImpersonationTab from "@/components/dashboard/admin/impersonationTab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage users, view activity, and control access
        </p>
      </div>

      <Tabs defaultValue={tab === "impersonation" ? "impersonation" : "directory"}>
        <TabsList>
          <TabsTrigger value="directory">All Users</TabsTrigger>
          <TabsTrigger value="impersonation">Impersonation Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          <ErrorBoundary fallback={<SectionErrorFallback title="Users List" />}>
            <Suspense fallback={<AdminUsersSkeleton />}>
              <UsersSection />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="impersonation">
          <ErrorBoundary fallback={<SectionErrorFallback title="Impersonation log" />}>
            <ImpersonationTab />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  )
}
