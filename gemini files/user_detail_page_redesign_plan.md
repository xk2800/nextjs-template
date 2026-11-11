# User Detail Page Redesign & Enhancement Plan

## 1. Executive Summary

The individual User Detail route (`/dashboard/admin/users/[id]`) serves as the administrative command center for inspecting and managing a single user account.

While the current layout displays basic account status and creation dates, it lacks **administrative action controls** (such as impersonation, role toggling, password resets, or account banning) and suffers from repeated metadata across multiple cards.

This document outlines structural UX improvements to transform the detail page into an actionable, multi-tab administrative workspace.

## 2. Audit & Opportunity Breakdown

| Area / Feature | Current State | Target State | 
| ----- | ----- | ----- | 
| **Admin Actions** | No action buttons exist on the page; admins are read-only. | Add an Action Toolbar in the page header with **Impersonate**, **Change Role**, **Reset Password**, **Ban Account**, and **Delete**. | 
| **Data Redundancy** | Email address and user role are repeated 3 times across the header, Profile card, and Account Details card. | Consolidate core identity into a unified Profile Header card and group functional settings cleanly below. | 
| **Session Control** | No visibility into active sessions for this specific user. | Include a **User Active Sessions** table allowing admins to inspect IP addresses and selectively revoke specific user sessions. | 
| **Security & 2FA State** | No security verification details visible (e.g., 2FA status, passkeys registered). | Add a Security card displaying 2FA enrolment status, registered OAuth providers, and security flags. | 
| **Activity History** | No history of what this user has done or when admins modified their account. | Add a **User Activity Audit Log** timeline feed. | 

## 3. Recommended Layout Structure

```
+-----------------------------------------------------------------------------------------+
| ← Back to Users                                                                         |
| Xavier Khew (xavier@example.com)                   [ 🎭 Impersonate ] [ ⚙️ Actions ▾ ]   |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
| +-----------------------------------------+ +-----------------------------------------+ |
| | Profile & Account Details (1/3 Width)   | | Main Detail Tabs (2/3 Width)            | |
| |                                         | | [ Overview ] [ Sessions ] [ Audit Log ] | |
| | [ Avatar ]  Xavier Khew                 | +-----------------------------------------+ |
| |             admin                       | |                                         | |
| |                                         | | Tab Content Container                   | |
| | Status: Active                          | | - Account Metadata & Role Form          | |
| | Email: Verified                         | | - Security & 2FA Status                 | |
| | Joined: Oct 20, 2026                    | | - Active User Sessions Table            | |
| | Last Login: 10 mins ago                 | | - User Specific Activity Stream         | |
| |                                         | |                                         | |
| | --------------------------------------- | |                                         | |
| | DANGER ZONE                             | |                                         | |
| | [ Ban Account ] [ Revoke Sessions ]     | |                                         | |
| +-----------------------------------------+ +-----------------------------------------+ |
|                                                                                         |
+-----------------------------------------------------------------------------------------+

```

## 4. Sub-Tab & Section Breakdown

### 1. Header Toolbar

* **Back Navigation:** `← Back to Users` link back to `/dashboard/admin/users`.

* **Primary Actions:**

  * 🎭 **Impersonate User:** Instantly switch admin session into this user's context.

  * 🛡️ **Role Selector Dropdown:** Quick toggle between `user` and `admin`.

  * ⚙️ **More Actions Menu (`...`):** Send password reset email, force email re-verification, or trigger account export.

### 2. Left Column: Quick Profile & Risk Summary (1/3 Width)

* **User Identity Card:** Avatar, display name, user ID, email address, and email verification status.

* **Status & Timestamps:** Current status badge (`Active` / `Banned`), creation date, last login timestamp, and IP location.

* **Quick Danger Zone:** Immediate actions to **Ban User** or **Revoke All Active Sessions** for this user.

### 3. Right Column: Tabbed Detailed View (2/3 Width)

#### Tab 1: Account Overview

* **Role & Permissions Card:** Displays granted permissions and role status with an inline edit form.

* **Security & Authentication Card:** Indicates whether 2FA is active, number of passkeys registered, and linked OAuth identity providers (e.g., GitHub, Google).

#### Tab 2: User Sessions (`?tab=sessions`)

* **Active Sessions Data Table:** Lists all devices currently logged into this specific user's account with device type, IP address, location, and an inline **"Revoke"** button per session.

#### Tab 3: Activity & Audit Logs (`?tab=activity`)

* **User Audit Log Feed:** Timeline of key security and application events associated with this account (e.g., logins, password changes, admin updates).

## 5. Code Architecture Blueprint (`app/dashboard/admin/users/[id]/page.tsx`)

```
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfileSidebar } from "./_components/user-profile-sidebar";
import { UserOverviewTab } from "./_components/user-overview-tab";
import { UserSessionsTab } from "./_components/user-sessions-tab";
import { UserAuditTab } from "./_components/user-audit-tab";
import { UserActionToolbar } from "./_components/user-action-toolbar";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Back Link & Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/admin/users"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Users
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">User Details</h1>
        </div>
        <UserActionToolbar userId={id} />
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Sidebar Card */}
        <div className="lg:col-span-1">
          <UserProfileSidebar userId={id} />
        </div>

        {/* Right Tabbed Detail Container */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
              <TabsTrigger value="activity">Audit Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <UserOverviewTab userId={id} />
            </TabsContent>

            <TabsContent value="sessions">
              <UserSessionsTab userId={id} />
            </TabsContent>

            <TabsContent value="activity">
              <UserAuditTab userId={id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

```

## 6. Implementation Checklist

* \[ \] Create sub-components directory under `app/dashboard/admin/users/[id]/_components/`.

* \[ \] Build `<UserActionToolbar />` with **Impersonate**, **Ban**, and **Password Reset** triggers.

* \[ \] Consolidate duplicate metadata into `<UserProfileSidebar />`.

* \[ \] Build `<UserSessionsTab />` to display and manage active sessions specifically for `params.id`.

* \[ \] Build `<UserAuditTab />` showing user-specific event logs.

* \[ \] Wire action triggers to `Better-Auth` admin API endpoints (`/api/admin/users/impersonate`, `/api/admin/users/ban`).