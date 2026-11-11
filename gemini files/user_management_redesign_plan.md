# User Management Redesign & Enhancement Plan

## 1. Executive Summary

The `/dashboard/admin/users` page handles primary user administration, role assignments, security status tracking, and impersonation auditing. While essential capabilities like impersonation logging, CSV exports, and user invitations are present, the current layout suffers from fragmented search containers, stacked vertical blocks, and missing inline row actions.

This document outlines structural UX improvements to consolidate search controls, implement bulk action workflows, add row-level contextual menus, and optimize screen space.

## 2. Audit & Enhancement Opportunities

| Feature / Area | Current State | Proposed Enhancement |
| ----- | ----- | ----- |
| **Search & Filters** | Search Users input sits in a separate standalone card above the table. | Merge search bar and filter dropdowns (Role, Status) directly into the table header. |
| **Row Actions** | Table lacks an Actions column; admins cannot act directly on a specific user row. | Add a right-aligned Dropdown Menu (`...`) with *Impersonate*, *Change Role*, *Ban/Unban*, and *Delete Account*. |
| **Bulk Actions** | Table rows feature selection checkboxes, but no bulk action toolbar is rendered when items are selected. | Add a floating Bulk Action Bar that slides up when 1+ rows are checked to trigger **Bulk Ban**, **Bulk Delete**, or **Export Selected**. |
| **Impersonation Logs** | Logs sit in a card directly above search, pushing the primary user list below the fold. | Move impersonation logs to a dedicated sub-tab (`All Users` \| `Impersonation Audit Logs`) or slide-over drawer. |
| **Audit Feed Display** | Impersonation logs display raw database IDs (e.g., `user wpdenkd1nys2...`). | Resolve user database IDs to human-readable names and email addresses during query execution. |

## 3. Structural Wireframe

```
+---------------------------------------------------------------------------------------+
| User Management                                                                       |
| Manage users, view activity, and control access                                       |
+---------------------------------------------------------------------------------------+
| [ Tabs: All Users (11) ]  [ Impersonation Audit Logs ]  [ Banned Users (0) ]           |
+---------------------------------------------------------------------------------------+
| Users Directory                                                                       |
| [ Search users... ] [Role: All ▾] [Status: All ▾]              [+ Invite] [Export CSV] |
+---------------------------------------------------------------------------------------+
| [x] Name          | Email            | Role   | Status  | Joined       | Actions     |
|-------------------+------------------+--------+---------+--------------+-------------|
| [ ] Xavier Dev    | xavier@gmail.com | Admin  | Active  | Oct 20, 2026 | [ ... ▾ ]   |
| [ ] Test User     | test@example.com | User   | Active  | Oct 05, 2026 | [ ... ▾ ]   |
+---------------------------------------------------------------------------------------+
| (Floating Bar) 2 Users Selected  [ Bulk Ban ] [ Bulk Delete ] [ Export Selected ]     |
+---------------------------------------------------------------------------------------+
| Showing 1 - 10 of 11 users                                     [< Previous] [Next >]  |
+---------------------------------------------------------------------------------------+
```

## 4. Component Breakdown & DX Objectives

### 1. Table Toolbar & Search

* **File:** `@/components/admin/users/user-table-toolbar.tsx`
* **Purpose:** Integrates search input, role filters (`All`, `Admin`, `User`), status filters (`Active`, `Banned`), export actions, and invite modals into a unified control header.

### 2. User Row Context Actions

* **File:** `@/components/admin/users/user-row-actions.tsx`
* **Purpose:** Renders a clean Shadcn UI DropdownMenu for every row supporting:
  * 🎭 **Impersonate User** (triggers admin session swap)
  * 🛡️ **Change Role** (toggles role state between `user` and `admin`)
  * 🚫 **Ban / Unban User** (invokes `/api/admin/users/ban`)
  * 🗑️ **Delete Account** (opens confirmation dialog before removal)

### 3. Floating Bulk Action Bar

* **File:** `@/components/admin/users/bulk-actions-bar.tsx`
* **Purpose:** Appears dynamically at the bottom of the viewport when users check one or more table rows, allowing batch operations across selected records.

### 4. Impersonation Audit Tab

* **File:** `@/components/admin/users/impersonation-log-tab.tsx`
* **Purpose:** Provides a full-width timeline audit of all admin impersonation events without cluttering the main user management directory view.

## 5. Code Architecture Blueprint (`app/dashboard/admin/users/page.tsx`)

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserTableToolbar } from "@/components/admin/users/user-table-toolbar";
import { UsersDataTable } from "@/components/admin/users/users-data-table";
import { ImpersonationLogTab } from "@/components/admin/users/impersonation-log-tab";
import { BulkActionsBar } from "@/components/admin/users/bulk-actions-bar";

export default function UserManagementPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, view activity, and control access settings across your application.
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="directory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="directory">All Users</TabsTrigger>
          <TabsTrigger value="impersonation">Impersonation Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-4">
          <UserTableToolbar />
          <UsersDataTable />
          <BulkActionsBar />
        </TabsContent>

        <TabsContent value="impersonation">
          <ImpersonationLogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## 6. Implementation Checklist

* [ ] Consolidate search bar and dropdown filters into `<UserTableToolbar />`.
* [ ] Build `<UserRowActions />` component using Shadcn DropdownMenu for row operations.
* [ ] Add floating `<BulkActionsBar />` bound to table row selection state.
* [ ] Wire selection state to bulk endpoints (`/api/admin/users/bulk-ban`, `/api/admin/users/bulk-delete`).
* [ ] Move impersonation activity cards into the `Impersonation Logs` sub-tab.
* [ ] Resolve raw user IDs to email/name strings in audit log query responses.